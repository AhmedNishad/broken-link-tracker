const mongoose = require('mongoose');

main().catch(err => console.log(err));

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || 'mongodb://localhost:27017/brokenlink'

async function main() {
  await mongoose.connect(mongoConnectionString);
}

const analysisRequestSchema = new mongoose.Schema({
    email: String,
    requestId: String,
    baseUrl: String,
    siteMapUrl: String,
    results: String,
    insertedTimeStamp: Date,
    completedTimeStamp: Date,
    handled: Boolean,
    type: String,
    error: String,
    timeToComplete: Number,
    linkCount: Number
});

const AnalysisRequest = mongoose.model('AnalysisRequest', analysisRequestSchema);

module.exports = {
    AnalysisRequestModel: AnalysisRequest,
}

export {}