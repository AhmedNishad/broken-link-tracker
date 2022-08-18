const redis = require('redis');
const client = redis.createClient();
client.on('connect', function() {
});

module.exports = client;