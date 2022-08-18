const amqplib = require('amqplib');

var amqp_url = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';

async function produce(message: string){
    try{
        var conn = await amqplib.connect(amqp_url, "heartbeat=60");
        var ch = await conn.createChannel()
        var q = 'br_queue';
        await ch.assertQueue(q);
        ch.sendToQueue(q, Buffer.from(message));
    }catch(e){
        console.error(e);
    }
}

module.exports = produce;

export {}