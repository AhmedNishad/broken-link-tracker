
// fetch the robots.txt

const parseSiteMap = async (baseUrl: string) : Promise<any> => {
    const axios = require('axios');

    try{
        let hm: any = {};

        // if robots txt has sitemap link, use that
        if(!baseUrl.endsWith("/"))
            baseUrl = baseUrl + "/";
            
        let robotsRes = await axios.get(`${baseUrl}/robots.txt`);
        
        let siteMap = robotsRes.data.split("Sitemap:")[1].split("\n")[0].trim();
        console.log("Sitemap is at: " + siteMap);

        let linkCount = 0;
        const linkLimit = 30;

        const parseSiteMaps =  async (siteMapURL: string) => {
            console.log("parsing sitemap " + siteMapURL);
            if(linkCount > linkLimit){
                console.log(hm);
                return;
            }

            // get the sitemap xml
            let sitemapRes = await axios.get(siteMapURL);
            //console.log("Sitemap data: " + sitemapRes.data);

            // check if we're still in the sitemap
            /* console.log(sitemapRes.headers['content-type']);
            if(!sitemapRes.headers['content-type'].includes("text/xml")){
                // add to hm
                hm[siteMapURL] = sitemapRes.status;
                linkCount++;
                return;
            } */

            // if not try to ping a bunch of defaults

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
                // TODO - Recursively identify all links, make request and build up datastructure (D.F.S/ HM)
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
    

    /* axios.get('https://doctormobile.lk/bleh')
    .then((res: any) => {
      console.log(`statusCode: ${res.status}`);
    })
    .catch((error: any) => {
        console.log("error occurred: " + error.response.status);
    }); */
  
  
  // create a puppeteer instance
  (
      async () => {
          const puppeteer = require('puppeteer');
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto('https://news.ycombinator.com', {
          });
  
          await browser.close();
  })();
}

module.exports = parseSiteMap;

export {};
// find the relevant 