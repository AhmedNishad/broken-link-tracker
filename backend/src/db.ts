const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/brokenlink');
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