import { SiteResult } from "./crawler/crawler";

const amqplib = require('amqplib');

var amqp_url = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';

const Crawler = require('./crawler/crawler');

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

async function handleMessage(msg: QueueMessage){
    let results = {};
    let siteResults: SiteResult[] = [];
    let linkCount = 0;
    if(msg.type == 'page'){
        let crawler = new Crawler(msg.baseUrl, msg.requestId);
        await crawler.getSitemap();
        await crawler.crawl();
    }else if(msg.type == 'http'){
        let crawler = new Crawler(msg.baseUrl, msg.requestId);
        await crawler.getSitemap();
        await crawler.crawl();
        results = crawler.results;
        linkCount = crawler.linkCount;
        siteResults = crawler.crawlResults;
    }

    // mail the report

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
            await handleMessage(obj);
            await ch.ack(msg);
            console.log("Acknowledged Message " + obj.requestId)
        });
    }catch(e){
        console.error(e);
    }   
}

module.exports = do_consume;

export {}