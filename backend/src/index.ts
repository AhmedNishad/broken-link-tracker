// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

// Declare a route
// crawl expects a URL that will be crawled
fastify.get('/crawl', async (request: any, reply: any) => {

    // begin a pupetteer instance

    // find the relevant page 

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