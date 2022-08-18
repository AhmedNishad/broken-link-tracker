
// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

const {crawlSitemap, parseSiteMap}  = require('./crawler/sitemap');

const redis = require('redis');
const client = redis.createClient();

const publishToQueue = require('./queuePublisher');
const queueConsumer = require('./queueConsumer');

const {AnalysisRequestModel} = require("./db");

var MAX_PROCESS_COUNT = process.env.MAX_PROCESS_COUNT || 2;


// crawl expects a URL that will be analuzed through the sitemap
fastify.get('/crawl', async (request: any, reply: any) => {
  // check if there are already  MAX_PROCESS_COUNT messages

  let currentQueueCount = await AnalysisRequestModel.countDocuments({ handled:false });
  if(currentQueueCount > MAX_PROCESS_COUNT){
    return {error: "Server overloaded, please try again later"}
  }

  let requestId = (new Date()).getTime(); // make timestamp
  let {email, url, type} = request.query;

  // default the type to http
  if(!type){
    type = "http"
  }
  
  // save request to Mongo
  let analysisRequest = new AnalysisRequestModel({
    requestId: requestId,
    email,
    baseUrl: url,
    type, // browser is also available
    insertedTimeStamp: new Date(),
    handled: false,
  });
  await analysisRequest.save();

  // send to RabbitMQ
  await publishToQueue(JSON.stringify(analysisRequest));

  return {requestId: requestId};
})

fastify.get('/results', async (request: any, reply: any) => {
  let {id} = request.query;
  let analysisRequests = await AnalysisRequestModel.find({requestId: id});
  console.log(analysisRequests);
  if(analysisRequests.length > 0){
    let analysisRequest = analysisRequests[0];
    if(analysisRequest.handled && analysisRequest.results){
      return analysisRequest;
    }else{
      return {message: "Message is still being handled"}
    }
  }
  return await crawlSitemap(request.query.url);
})

// listens for queue events
queueConsumer().then(() => {
  
})

// spins up fastify server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()