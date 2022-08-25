const axios = require('axios'); 
const puppeteer = require('puppeteer');
const { XMLParser} = require("fast-xml-parser");

const { searchGoogle } = require('./sitemap');
const fs = require('fs');
const linkLimit = parseInt(process.env.linkLimit || "") || 10;

export interface SiteResult{
    statusCode: string;
    links: LinkResult[];
}

export interface LinkResult{
    link: string;
    snapshotLocation: string | null;
    pageLoadTime: number | null;
}
export class Crawler{
    baseUrl: string;
    requestId: string; 
    siteMapUrl: string;
    type: string;
    linkCount: number;
    results: any;

    crawlResults: SiteResult[];

    constructor(baseUrl: string, requestId: string, type: string = "http"){
        this.baseUrl = baseUrl;
        this.requestId = requestId;
        this.siteMapUrl = "";
        this.results = {};
        this.type = type;
        this.linkCount = 0;
        this.crawlResults = [];
    }

    setSitemap(sitemap: string){
        this.siteMapUrl = sitemap;
    }

    private addToResult(statusCode: string, result: LinkResult){
        let i = this.crawlResults.findIndex(c => c.statusCode == statusCode);
        if(i == -1){
            this.crawlResults.push({ statusCode, links: [result] });
        }else{
            this.crawlResults[i].links.push(result);
        }
    }

    async getSitemap(){
        let siteMap = "";
    
        if(this.baseUrl.endsWith("/")){
            this.baseUrl = this.baseUrl.slice(0, this.baseUrl.length - 1)
        }
    
        // (1) if robots txt has sitemap link, use that
        // otherwise try a number of different sitemap URLs
        let robotsRes = await axios.get(`${this.baseUrl}/robots.txt`);
        if(robotsRes.status == "200"){
            if(robotsRes.data.toLowerCase().includes("sitemap:")){
                // TODO - need to account for multiple occurences of the sitemap
                this.siteMapUrl = robotsRes.data.toLowerCase().split("sitemap:")[1].split("\n")[0].trim();
                return siteMap;
            }
        }
        
        // (2) if not found, try a list of common locations
        let possibleSiteMapLocations: string[] = ['sitemap.xml', 'sitemap_index.xml', 'sitemap-index.xml', 'post-sitemap.xml', 
        'sitemap/sitemap.xml','sitemap/index.xml', 'rss.xml', 'sitemapindex.xml', 'sitemap.xml.gz', 'sitemap_index.xml.gz', 'sitemap.php', 
        'sitemap.txt', 'atom.xml'];
    
        // they could also be the capitalized versions of these;
        possibleSiteMapLocations = [...possibleSiteMapLocations, 
            ...possibleSiteMapLocations.map((s: string) => {
                return s.toString()[0].toUpperCase() + s.toString().slice(1, s.length)
        })];
    
        for(let location of possibleSiteMapLocations){
            let sm = `${this.baseUrl}/${location}`;
            let siteMapRes = await axios.get(sm);
            if(siteMapRes.status == "200"){
                this.siteMapUrl = sm;
                return sm;
            }
        }
        
        // (3) if not try googling the sitemap - site:example.com inurl:sitemap filetype:xml
        let googleSearchTerm = `site:${new URL(this.baseUrl).host} inurl:sitemap`;
        let googleResults = await searchGoogle(googleSearchTerm);
        if(googleResults.length != 0){
            siteMap = googleResults[0].link;
        }else{
            this.siteMapUrl = "";
        }
    
        return siteMap;
    }

    async crawl(){
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        console.log("Crawling page at " +  this.siteMapUrl);
        try{
            if(this.siteMapUrl == ""){
                this.results = {error: "Unable to find sitemap URL"};
                throw 'Unable to find sitemap URL';
            }

            //let linkCount = 0;
            const parseSiteMaps =  async (siteMapURL: string) => {
                if(this.linkCount > linkLimit){
                    return;
                }

                // get the sitemap xml
                let sitemapRes = await axios.get(siteMapURL);
                console.log(sitemapRes.headers['content-type']);
                // if the url ends with XML, handle with this
                if(sitemapRes.headers['content-type'].includes('xml')){
                    // parse this xml
                    const parser = new XMLParser();
                    let jObj = parser.parse(sitemapRes.data);
                    
                    if(jObj.sitemapindex){
                        let sitemaps = jObj.sitemapindex.sitemap;
                        console.log("-------- site maps start --------------")
                        for(let i = 0; i < 5; i++){
                            console.log(sitemaps[i]);
                        }
                        console.log("-------- site maps end --------------")
                        
                        for(let i = 0; i < sitemaps.length; i++){
                            await parseSiteMaps(sitemaps[i].loc);
                        }
                    }else if(jObj.urlset){
                        let urlSets = jObj.urlset.url;
                        console.log("-------- url sets start --------------")
                        for(let i = 0; i < 5; i++){
                            console.log(urlSets[i]);
                        }
                        console.log("-------- url sets end --------------")
                        
                        // use axios all to speed up - TODO
                        /* if(urlSets && Array.isArray(urlSets)){
                            axios.all(urlSets.slice(0, linkLimit).map((urlSet: any) => axios.get(urlSet.loc))).then(
                                (data: any) => {
                                    console.log(data.ma);
                                },
                                );
                                return;
                            } */

                        for(let i = 0; i < urlSets.length; i++){
                            let urlLocation = urlSets[i].loc;

                            console.log(this.linkCount + ") checking URL " + urlLocation);
                            if(this.linkCount > linkLimit){
                                return;
                            }
                            if(this.type == "browser"){
                                try{
                                    let urlRes = await page.goto(urlLocation, {});
                                    this.results[urlLocation] = urlRes.status();
                                    this.addToResult(urlRes.status, {
                                        link: urlLocation,
                                        snapshotLocation: null,
                                        pageLoadTime: 0
                                    });

                                }catch(error:any){
                                    if(error.response){
                                        this.results[urlLocation] = error.response.status;
                                        let ssPath = `images/${this.requestId}`;
                                        if(!fs.existsSync(ssPath)){
                                            fs.mkdirSync(ssPath);
                                        }
                                        ssPath = `${ssPath}/${this.linkCount}.png`;
                                        console.log("Saving SS at " + ssPath);
                                        await page.goto(urlLocation, {
                                            waitUntil: 'networkidle2'
                                        });
                                      //  await page.waitForTimeout(500);
                                        await page.screenshot({ path: ssPath , fullPage: true });
                                        this.addToResult(error.response.status, {
                                            link: urlLocation,
                                            snapshotLocation: ssPath,
                                            pageLoadTime: 0
                                        });
                                    }else{
                                        console.error(error);
                                    }
                                }
                            }else if(this.type == "http"){
                                try{
                                    let urlRes = await axios.get(urlLocation);
                                    this.results[urlLocation] = urlRes.status;
                                    this.addToResult(urlRes.status, {
                                        link: urlLocation,
                                        snapshotLocation: null,
                                        pageLoadTime: 0
                                    });
                                    
                                }catch(error:any){
                                    if(error.response){
                                        this.results[urlLocation] = error.response.status;
                                        let ssPath = `images/${this.requestId}`;
                                        if(!fs.existsSync(ssPath)){
                                            fs.mkdirSync(ssPath);
                                        }
                                        ssPath = `${ssPath}/${this.linkCount}.png`;
                                        console.log("Saving SS at " + ssPath);
                                        await page.goto(urlLocation, {
                                            waitUntil: 'networkidle2'
                                        });
                                       // await page.waitForTimeout(500);
                                        await page.screenshot({ path: ssPath , fullPage: true });
                                        this.addToResult(error.response.status, {
                                            link: urlLocation,
                                            snapshotLocation: ssPath,
                                            pageLoadTime: 0
                                        });
                                    }else{
                                        console.error(error);
                                    }
                                }
                            }
                            this.linkCount++;
                        }
                    }
                }else if(sitemapRes.headers['content-type'].includes('text/plain')){
                    let urls = sitemapRes.data.split('\r\n');
                    for(let i = 0; i < urls.length; i++){
                        let urlLocation = urls[i];
                        console.log(this.linkCount + ")checking URL " + urlLocation);
                        if(this.linkCount > linkLimit){
                            return;
                        }
                        if(this.type == "browser"){
                            try{
                                let urlRes = await page.goto(urlLocation, {});
                                this.results[urlLocation] = urlRes.status();
                                
                            }catch(error:any){
                                this.results[urlLocation] = error.response.status;
                            }
                        }else if(this.type == "http"){
                            try{
                                let urlRes = await axios.get(urlLocation);
                                this.results[urlLocation] = urlRes.status;
                            }catch(error:any){
                                this.results[urlLocation] = error.response.status;
                            }
                        }
                        
                        this.linkCount++;
                    }
                }
            }
            await parseSiteMaps(this.siteMapUrl);
        }catch(e: any){
            if(e.response){
                console.error(e.response.status)
            }else{
                console.error(e);
            }
            this.results = {error: "Error occurred while crawling " + this.baseUrl}
        }finally{
            browser.close();
        }
    }
}

module.exports = Crawler;

export {}