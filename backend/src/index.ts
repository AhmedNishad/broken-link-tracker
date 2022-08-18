
// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

const {crawlSitemap, parseSiteMap}  = require('./crawler/sitemap');

const redis = require('redis');
const client = redis.createClient();


const publishToQueue = require('./queuePublisher');
const queueConsumer = require('./queueConsumer');

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
    baseUrl: url,
    type: "http" // browser is also available
  };
  console.log(analysisRequest);
  //await client.connect();
  
  // save request in Redis
  //await client.set(requestId.getTime().toString(), JSON.stringify(analysisRequest));

  // save request to Mongo - TODO

  // send to RabbitMQ? - TODO - Learn

  await publishToQueue(JSON.stringify(analysisRequest));

  return {requestId: requestId.getTime()};

  

  return await parseSiteMap(request.query.url);

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