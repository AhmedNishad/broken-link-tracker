const axios = require('axios'); 
const puppeteer = require('puppeteer');
const { XMLParser} = require("fast-xml-parser");

const { searchGoogle } = require('./sitemap');

const linkLimit = process.env.linkLimit || 10;

export class Crawler{
    baseUrl: string;
    requestId: string; 
    siteMapUrl: string;

    results: any;

    constructor(baseUrl: string, requestId: string){
        this.baseUrl = baseUrl;
        this.requestId = requestId;
        this.siteMapUrl = "";
        this.getSitemap();
        console.log("Sitemap is at: " + this.siteMapUrl);
        this.results = {};
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

        try{
            let hm: any = {};

            if(this.siteMapUrl == ""){
                this.results = {error: "Unable to find sitemap URL"};
                throw 'Unable to find sitemap URL';
            }

            let linkCount = 0;
            const parseSiteMaps =  async (siteMapURL: string) => {
                console.log("parsing sitemap " + siteMapURL);
                if(linkCount > linkLimit){
                    return;
                }

                // get the sitemap xml
                let sitemapRes = await axios.get(siteMapURL);
                // if the url ends with XML, handle with this
                if(sitemapRes.headers['content-type'].includes('application/xml')){
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
                        
                        for(let i = 0; i < urlSets.length; i++){
                            let urlLocation = urlSets[i].loc;
                            console.log("checking URL " + urlLocation);
                            if(linkCount > linkLimit){
                                return;
                            }
                            try{
                                let urlRes = await page.goto(urlLocation, {});
                                hm[urlLocation] = urlRes.status();
                            }catch(error:any){
                                hm[urlLocation] = error.response.status;
                            }
                            linkCount++;
                        }
                    }
                }else if(sitemapRes.headers['content-type'].includes('text/plain')){
                    let urls = sitemapRes.data.split('\r\n');
                    for(let i = 0; i < urls.length; i++){
                        let urlLocation = urls[i];
                        console.log("checking URL " + urlLocation);
                        if(linkCount > linkLimit){
                            return;
                        }
                        try{
                            let urlRes = await page.goto(urlLocation, {});
                            this.results[urlLocation] = urlRes.status();
                        }catch(error:any){
                            this.results[urlLocation] = error.response.status;
                        }
                        linkCount++;
                    }
                }
            }
            await parseSiteMaps(this.siteMapUrl);
        }catch(e: any){
            if(e.response){
                console.log(e.response.status)
            }else{
                console.log(e);
            }
            this.results = {error: "Error occurred while crawling " + this.baseUrl}
        }finally{
            browser.close();
        }
    }
}