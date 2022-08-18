export class AnalysisRequest{
    email: string;
    requestId: string;
    baseUrl: string;

    constructor(){
        this.email = "";
        this.requestId = "";
        this.baseUrl = "";
    }
}

import { Entity, Schema } from 'redis-om'
import client from '../redis-client';

/* our entity */
class Request extends Entity {}

/* create a Schema for Person */
const analysisSchema = new Schema(Request, {
    email: { type: 'string' },
    requestId: { type: 'string' },
    baseUrl: { type: 'string' },
    /* siteMapUrl: { type: 'string' },
    results: { type: 'string' } */
})

/* use the client to create a Repository just for Persons */
export const analysisRepository = async () => {
    return await (await client()).fetchRepository(analysisSchema);
} 

/* create the index for Person */
analysisRepository().then(async (repo) => {
    await repo.createIndex();
    console.log("Created index for ")
})