// responsible for

// read from consumers - TODO - Learn

// take snaps and create PDF - TODO

// send email to client - TODO

const amqplib = require('amqplib');

var amqp_url = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';

const Crawler = require('./crawler/crawler');

export interface QueueMessage{
    requestId: string;
    email: string;
    baseUrl: string;
    type: string;
}

async function handleMessage(msg: QueueMessage){
    if(msg.type == 'page'){
        let crawler = new Crawler(msg.baseUrl, msg.requestId);
        await crawler.getSitemap();
        console.log(crawler.siteMapUrl);
        await crawler.crawl();
        console.log(crawler.results);
    }else if(msg.type == 'http'){
        let crawler = new Crawler(msg.baseUrl, msg.requestId);
        await crawler.getSitemap();
        console.log(crawler.siteMapUrl);
        await crawler.crawl();
        console.log(crawler.results);
    }
}

async function do_consume() {
    console.log("QUEUE: Listening for messages");
    try{
        var conn = await amqplib.connect(amqp_url, "heartbeat=60");
        var ch = await conn.createChannel()
        var q = 'br_queue';
        await ch.assertQueue(q);
        ch.consume(q, async function (msg: any) {
            console.log("Message received");
            console.log(msg.content.toString());
            let obj = JSON.parse(msg.content.toString());
            console.log(obj);
            await handleMessage(obj);
            await ch.ack(msg);
            console.log("Acknowledged Message " + obj.requestId)
        });
    }catch(e){
        console.error(e);
    }   
}

/* do_consume().then(() => {
    console.log("Listening for messages");
}); */

module.exports = do_consume;

export {}