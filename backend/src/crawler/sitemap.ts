const axios = require('axios');

const linkLimit = process.env.linkLimit || 10;

const puppeteer = require('puppeteer');

const searchGoogle = async (searchQuery: string) : Promise<any[]> => {
    /** by default puppeteer launch method have headless option true*/
    const browser = await puppeteer.launch({
    headless: true
            });
    const page = await browser.newPage();
    await page.goto('https://www.google.lk/');
    await page.type('input[aria-label="Search"]', searchQuery);
    await page.keyboard.press('Enter');
    
    let list: any[] = [];
    /** waitfor while loding the page, otherwise evaulate method will get failed. */
    try{
        await page.waitForSelector('.g', {
            visible: true,
            timeout: 5000
          });
         // const googleHandle = await page.$$('.g');
          const searchHandle = await page.$('#search');
            list = await page.evaluate(() => {
            let data = []
           const list: NodeListOf<any> = document.querySelectorAll('.g');
            for (const a of list) {
                console.log(a);
                data.push({
                    'title': a.querySelector('h3').innerText.trim().replace(/(\r\n|\n|\r)/gm, " "),
                    'link': a.querySelector('a').href
                        })
            }
            return data;
        })

    }catch(e){
        console.log(e);
    }
    console.log(list);
    await browser.close();
    return list;
}

const getSiteMapUrl = async (baseUrl: string) : Promise<string> => {
    let siteMap = "";
    
    if(baseUrl.endsWith("/")){
        baseUrl = baseUrl.slice(0, baseUrl.length - 1)
    }

    // (1) if robots txt has sitemap link, use that
    // otherwise try a number of different sitemap URLs
    let robotsRes = await axios.get(`${baseUrl}/robots.txt`);
    if(robotsRes.status == "200"){
        if(robotsRes.data.toLowerCase().includes("sitemap:")){
            // TODO - need to account for multiple occurences of the sitemap
            siteMap = robotsRes.data.toLowerCase().split("sitemap:")[1].split("\n")[0].trim();
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
        let sm = `${baseUrl}/${location}`;
        let siteMapRes = await axios.get(sm);
        if(siteMapRes.status == "200"){
            return sm;
        }
    }
    
    // (3) if not try googling the sitemap - site:example.com inurl:sitemap filetype:xml
    let googleSearchTerm = `site:${new URL(baseUrl).host} inurl:sitemap`;
    let googleResults = await searchGoogle(googleSearchTerm);
    console.log(googleResults);
    if(googleResults.length != 0){
        siteMap = googleResults[0].link;
    }

    console.log("Sitemap is at: " + siteMap);
    return siteMap;
}

// TODO - Rewrite to be OOP (Reduce duplication)
// TODO - Use more TS features - LEARN
const parseSiteMap = async (baseUrl: string) : Promise<any> => {
    try{
        let hm: any = {};

        if(!baseUrl.endsWith("/"))
        baseUrl = baseUrl + "/";

        let siteMap = await getSiteMapUrl(baseUrl);

        let linkCount = 0;

        // if the url ends with XML, handle with this
        const parseSiteMaps =  async (siteMapURL: string) => {
            console.log("parsing sitemap " + siteMapURL);
            if(linkCount > linkLimit){
                console.log(hm);
                return;
            }

            // get the sitemap URL
            let sitemapRes = await axios.get(siteMapURL);
            if(sitemapRes.headers['content-type'].includes('xml')){
                // parse this xml
                const { XMLParser} = require("fast-xml-parser");
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
                            let urlRes = await axios.get(urlLocation);
                            hm[urlLocation] = urlRes.status;
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
                        let urlRes = await axios.get(urlLocation);
                        hm[urlLocation] = urlRes.status;
                    }catch(error:any){
                        hm[urlLocation] = error.response.status;
                    }
                    linkCount++;
                }
            }
        }

        await parseSiteMaps(siteMap);
        console.log(hm);
        return hm;
    }catch(e: any){
        if(e.response){
            console.log(e.response.status)
        }else{
            console.log(e);
        }
        return {error: "Error occurred while crawling " + baseUrl}
    }
    
}

const crawlSitemap = async (baseUrl: string) : Promise<any> => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try{
        let hm: any = {};

        // if robots txt has sitemap link, use that
        if(!baseUrl.endsWith("/"))
            baseUrl = baseUrl + "/";
            
        let siteMap = await getSiteMapUrl(baseUrl);

        if(siteMap == ""){
            return {error: "Unable to find sitemap URL"};
        }

        let linkCount = 0;
        const parseSiteMaps =  async (siteMapURL: string) => {
            console.log("parsing sitemap " + siteMapURL);
            if(linkCount > linkLimit){
                console.log(hm);
                return;
            }

            // get the sitemap xml
            let sitemapRes = await axios.get(siteMapURL);
            // if the url ends with XML, handle with this
            if(sitemapRes.headers['content-type'].includes('xml')){
                // parse this xml
                const { XMLParser} = require("fast-xml-parser");
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
                        hm[urlLocation] = urlRes.status();
                    }catch(error:any){
                        hm[urlLocation] = error.response.status;
                    }
                    linkCount++;
                }
            }
        }
        await parseSiteMaps(siteMap);
           
        console.log(hm);
        return hm;
    }catch(e: any){
        if(e.response){
            console.log(e.response.status)
        }else{
            console.log(e);
        }
        return {error: "Error occurred while crawling " + baseUrl}
    }finally{
        browser.close();
    }

}

module.exports = {
    parseSiteMap,
    crawlSitemap,
    searchGoogle
}

export{}