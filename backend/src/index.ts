// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

const parseSiteMap = require('./crawler/sitemap');

// crawl expects a URL that will be crawled
fastify.get('/crawl', async (request: any, reply: any) => {

    // begin a pupetteer instance

    // find the relevant page 

  return { hello: 'world' }
})

// crawl expects a URL that will be crawled
fastify.get('/sitemap', async (request: any, reply: any) => {
  console.log(request.query.url);
 return await parseSiteMap("https://doctormobile.lk");

return { hello: 'world' }
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