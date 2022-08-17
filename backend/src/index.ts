// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })

const {crawlSitemap, parseSiteMap}  = require('./crawler/sitemap');

//import {parseSiteMap} from './crawler/sitemap';

// crawl expects a URL that will be crawled
fastify.get('/crawl', async (request: any, reply: any) => {
  return await crawlSitemap(request.query.url);
})

// crawl expects a URL that will be analuzed through the sitemap
fastify.get('/sitemap', async (request: any, reply: any) => {
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