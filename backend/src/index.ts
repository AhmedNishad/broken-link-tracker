
// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

const {crawlSitemap, parseSiteMap}  = require('./crawler/sitemap');

const redis = require('redis');
const client = redis.createClient();

const publishToQueue = require('./queuePublisher');
const queueConsumer = require('./queueConsumer');

const {AnalysisRequestModel} = require("./db");

// crawl expects a URL that will be crawled
fastify.get('/crawl', async (request: any, reply: any) => {
  return await crawlSitemap(request.query.url);
})

// crawl expects a URL that will be analuzed through the sitemap
fastify.get('/sitemap', async (request: any, reply: any) => {

  // check if 

  let requestId = (new Date()).getTime(); // make timestamp
  let {email, url} = request.query;

  /* let analysisRequest: any = {
    requestId: requestId,
    email,
    baseUrl: url,
    type: "http" // browser is also available
  }; */
  
  // save request to Mongo
  let analysisRequest = new AnalysisRequestModel({
    requestId: requestId,
    email,
    baseUrl: url,
    type: "http", // browser is also available
    insertedTimeStamp: new Date(),
    handled: false,
  });
  await analysisRequest.save();
  console.log(analysisRequest);

  // send to RabbitMQ?

  await publishToQueue(JSON.stringify(analysisRequest));

  return {requestId: requestId};
})

queueConsumer().then(() => {
  
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