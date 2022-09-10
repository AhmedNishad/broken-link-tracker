import { SiteResult } from "./crawler/crawler";

const amqplib = require('amqplib');

var amqp_url = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';

const Crawler = require('./crawler/crawler');

const Mailer = require('./email');

const {AnalysisRequestModel} = require("./db");

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

function getEmailHTMLContent(results:  SiteResult[], resultId: string){
    // load html template

    // generate stats
    let okLinks = results.filter((r: SiteResult) => r.statusCode.startsWith("2"))
        .map(r => r.links.length)
        .reduce((a: number, b: number) => {
        return a + b
        });
    let brokenLinks = results.filter((r: SiteResult) => r.statusCode.startsWith("4") || r.statusCode.startsWith("5"))
        .map(r => r.links.length)
        .reduce((a: number, b: number) => {
            return a + b
        });
    let redirectLinks = results.filter((r: SiteResult) => r.statusCode.startsWith("3"))
        .map(r => r.links.length)
        .reduce((a: number, b: number) => {
        return a + b
        });

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

    // replace content from template
}

async function handleMessage(msg: QueueMessage){
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
    let content = getEmailHTMLContent(results, msg.requestId);
    await Mailer.sendMail(msg.requestId, msg.email);

    let model = await AnalysisRequestModel.findById(msg._id);
    if(model){
        model.handled = true;
       // model.results = JSON.stringify(results);
        model.results = JSON.stringify(siteResults);
        model.completedTimeStamp = new Date();
        model.linkCount = linkCount;
        await model.save();
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