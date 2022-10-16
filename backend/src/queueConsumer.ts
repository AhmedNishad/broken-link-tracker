import { SiteResult } from "./crawler/crawler";

const amqplib = require('amqplib');

var amqp_url = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';

const Crawler = require('./crawler/crawler');

const Mailer = require('./email');

const {AnalysisRequestModel} = require("./db");

const fs = require('fs').promises;
const path = require("path");
// todo - remove interface duplication
export interface QueueMessage{
    email: string;
    requestId: string;
    baseUrl: string;
    siteMapUrl: string;
    results: string;
    insertedTimeStamp: Date;
    completedTimeStamp: Date;
    handled: boolean;
    type: string;
    error: string;
    _id: string;
    siteResults: SiteResult[];
}

export interface CrawlResult{
    results: SiteResult[] | null | undefined;
}

const baseURL = process.env.BASE_APP_URL || `https://localhost:3000`;
let clientURL = process.env.CLIENT_APP_URL || `http://127.0.0.1:5173`;

async function getEmailHTMLContent(results:  SiteResult[], requestId: string, siteUrl: string) : Promise<string>{
    console.log(results);
    // load html template
    let templatePath = path.join(__dirname, "public/email-template.html")
    console.log(templatePath);
    const data = await fs.readFile(templatePath, "binary");
    let buffer = Buffer.from(data);
    let htmlContent = buffer.toString();

    // generate stats
    let okLinks = results.filter((r: SiteResult) => r.statusCode && r.statusCode.toString().startsWith("2"))
        .map(r => r.links.length)
    let okLinksCount = 0;
    if(okLinks.length > 0){
        okLinksCount = okLinks.reduce((a: number, b: number) => {
            return a + b
            });
    }    
    let brokenLinks = results.filter((r: SiteResult) => r.statusCode && r.statusCode.toString().startsWith("4") || r.statusCode.toString().startsWith("5"))
        .map(r => r.links.length)
        
    let brokenLinksCount = 0;
    if(brokenLinks.length > 0){
        brokenLinksCount = brokenLinks.reduce((a: number, b: number) => {
            return a + b
        });
    }    
    let redirectLinks = results.filter((r: SiteResult) => r.statusCode && r.statusCode.toString().startsWith("3"))
        .map(r => r.links.length);

    let redirectLinksCount = 0;
    if(redirectLinks.length > 0){
        redirectLinksCount = redirectLinks.reduce((a: number, b: number) => {
            return a + b
            });
    }    

    let totalPageLoadTime = 0;
    let totalPageCount = 0;
    for(let i = 0; i < results.length; i++){
        let result = results[i];
        result.links.forEach((l => {
            if(l.pageLoadTime){
                totalPageLoadTime += l.pageLoadTime;
                totalPageCount++;
            }
        }));
    }

    clientURL = clientURL.split(',')[0];
    // replace content from template
    htmlContent = htmlContent.replace("{{URL}}", siteUrl);
    htmlContent = htmlContent.replace("{{OK}}", okLinks.toString());
    htmlContent = htmlContent.replace("{{Broken}}", brokenLinks.toString());
    htmlContent = htmlContent.replace("{{Other}}", redirectLinks.toString());
    htmlContent = htmlContent.replace("{{Avg}}", parseFloat(`${totalPageLoadTime/totalPageCount}`).toString());
    htmlContent = htmlContent.replace("{{Link}}", `${clientURL}/results/${requestId}`);
    return htmlContent;
}
/* 
getEmailHTMLContent([{statusCode: "200", links: [{pageLoadTime: 500, link: "http:localhost.com", snapshotLocation: null}]}], "", "").then(() => {
    console.log("Sent");
}) */

async function handleMessage(msg: QueueMessage){
    try{
        let results: any = {};
        let siteResults: CrawlResult = { results: null };
        let linkCount = 0;
        if(msg.type == 'page'){ // Unused
            let crawler = new Crawler(msg.baseUrl, msg.requestId);
            await crawler.getSitemap();
            await crawler.crawl();
        }else if(msg.type == 'http'){
            let crawler = new Crawler(msg.baseUrl, msg.requestId);
            await crawler.getSitemap();
            await crawler.crawl();
            results.results = crawler.results;
            linkCount = crawler.linkCount;
            siteResults.results = crawler.crawlResults;
        }
    
        // mail the report
        let content = await getEmailHTMLContent(siteResults.results != null ?  siteResults.results : [], msg.requestId, msg.baseUrl);
        await Mailer.sendMail(msg.requestId, msg.email, content);
    
        let model = await AnalysisRequestModel.findById(msg._id);
        if(model){
            model.handled = true;
            model.results = JSON.stringify(siteResults);
            model.completedTimeStamp = new Date();
            model.linkCount = linkCount;
            await model.save();
        }
    }catch(e: any){
        console.error(e);
        // send email for failed cases
        let model = await AnalysisRequestModel.findById(msg._id);
        if(model){
            model.handled = true;
            model.results = JSON.stringify({error: e.message});
            model.completedTimeStamp = new Date();
            await model.save();
        }
        await Mailer.sendMail(msg.requestId, msg.email, "Sorry! We were unable to crawl your site...");
    }
}



async function do_consume() {
    console.log("QUEUE: Listening for messages");
    try{
        var conn = await amqplib.connect(amqp_url, "heartbeat=60");
        var ch = await conn.createChannel()
        var q = 'br_queue';
        await ch.assertQueue(q);
        ch.prefetch(1);
        ch.consume(q, async function (msg: any) {
            let obj = JSON.parse(msg.content.toString());
            console.log("Message received " + obj.requestId);
            try{
                await handleMessage(obj);
            }catch(err){
                console.log("Error occured while handling request: " + obj.requestId)
                console.error(err);
            }finally{
                await ch.ack(msg);
                console.log("Acknowledged Message " + obj.requestId)
            }
        });
    }catch(e){
        console.error(e);
    }   
}

module.exports = do_consume;

export {}