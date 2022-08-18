import { analysisRepository } from "./models/analysis-request";

// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

const {crawlSitemap, parseSiteMap}  = require('./crawler/sitemap');

//const redisClient = require('../src/redis-client');
const redisClient = require('../src/redis');

const redis = require('redis');
const client = redis.createClient();
//import {parseSiteMap} from './crawler/sitemap';

// crawl expects a URL that will be crawled
fastify.get('/crawl', async (request: any, reply: any) => {
  return await crawlSitemap(request.query.url);
})

// crawl expects a URL that will be analuzed through the sitemap
fastify.get('/sitemap', async (request: any, reply: any) => {
  let requestId = new Date(); // make timestamp
  let {email, url} = request.query;

  let analysisRequest: any = {
    requestId: requestId.getTime(),
    email,
    baseUrl: url
  };
  console.log(analysisRequest);
  await client.connect();
  await client.set(requestId.getTime().toString(), JSON.stringify(analysisRequest));
  //await (await analysisRepository()).createAndSave(analysisRequest)

  // save request in Redis - TODO - Learn

  return {};


  // send to RabbitMQ? - TODO - Learn

  // read from consumers - TODO - Learn

  // take snaps and create PDF - TODO

  // send email to client - TODO

  return await parseSiteMap(request.query.url);

})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()