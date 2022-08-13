const axios = require('axios');

const linkLimit = 10;

const getSiteMapUrl = async (baseUrl: string) : Promise<string> => {
    
    let siteMap = "";
    
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
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log("Sitemap is at: " + siteMap);
    return siteMap;
}

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
            if(sitemapRes.headers['content-type'] == 'text/xml'){
                // parse this xml
                const { XMLParser} = require("fast-xml-parser");
                const parser = new XMLParser();
                let jObj = parser.parse(sitemapRes.data);
                console.log(jObj);

                if(jObj.sitemapindex){
                    let sitemaps = jObj.sitemapindex.sitemap;
                    // TODO - Recursively identify all links, make request and build up datastructure (D.F.S/ HM)
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
            }else{

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
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try{
        let hm: any = {};

        // if robots txt has sitemap link, use that
        if(!baseUrl.endsWith("/"))
            baseUrl = baseUrl + "/";
            
        let siteMap = await getSiteMapUrl(baseUrl);

        let linkCount = 0;
        const linkLimit = 10;

        const parseSiteMaps =  async (siteMapURL: string) => {
            console.log("parsing sitemap " + siteMapURL);
            if(linkCount > linkLimit){
                console.log(hm);
                return;
            }

            // get the sitemap xml
            let sitemapRes = await axios.get(siteMapURL);

            // if the url ends with XML, handle with this
            if(sitemapRes.headers['content-type'] == 'text/xml'){

                // parse this xml
                const { XMLParser} = require("fast-xml-parser");
                const parser = new XMLParser();
                let jObj = parser.parse(sitemapRes.data);
                console.log(jObj);
                
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
    crawlSitemap
}

/* export {
    parseSiteMap,
}; */
// find the relevant 