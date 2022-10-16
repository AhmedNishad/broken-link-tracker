// injecting env from config
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const fastify = require('fastify')({ logger: true })

import cors from '@fastify/cors'

const {crawlSitemap, parseSiteMap}  = require('./crawler/sitemap');

const publishToQueue = require('./queuePublisher');
const queueConsumer = require('./queueConsumer');

const {AnalysisRequestModel} = require("./db");

const MAX_PROCESS_COUNT = process.env.MAX_PROCESS_COUNT || 2;
const CLIENT_APP_URL = process.env.CLIENT_APP_URL || `http://127.0.0.1:5173`;

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../images'),
  prefix: '/images/', // optional: default '/'
})

console.log(CLIENT_APP_URL.split(','));
fastify.register(cors, { 
  // update to the right CORS from env
  origin: CLIENT_APP_URL.split(',')
})

// crawl expects a URL that will be analuzed through the sitemap
fastify.get('/crawl', async (request: any, reply: any) => {
  // check if there are already  MAX_PROCESS_COUNT messages
  let currentQueueCount = await AnalysisRequestModel.countDocuments({ handled:false });
  if(currentQueueCount > MAX_PROCESS_COUNT){
    return {message: "Server overloaded, please try again later"}
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

fastify.get('/hello', async (request: any, reply: any) => {
  console.log("Request received!");
  return {message: "hello world"};
})

fastify.get('/results', async (request: any, reply: any) => {
  let {id} = request.query;
  let analysisRequests = await AnalysisRequestModel.find({requestId: id});
  console.log(analysisRequests);
  if(analysisRequests.length > 0){
    let analysisRequest = analysisRequests[0];
    if(analysisRequest.handled && analysisRequest.results){
      let {completedTimeStamp, insertedTimeStamp} = analysisRequest;
      let timeToComplete = completedTimeStamp.getTime() - insertedTimeStamp.getTime();
      analysisRequest.timeToComplete = timeToComplete;
      return analysisRequest;
    }else{
      return {message: "Message is still being handled"}
    }
  }else{
    return {message: "This request is not found"}
  }
})

// listens for queue events
queueConsumer().then(() => {
})

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await fastify.listen({ port: port, host: "0.0.0.0" }); // TODO - Figure out what this is in PROD
    console.log("Listening on port " + port);
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
} // Start web server
start().then(() => {

})

