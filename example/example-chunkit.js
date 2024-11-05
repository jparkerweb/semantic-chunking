// ------------------------
// -- example-chunkit.js --
// -------------------------------------------------------------------------------
// this is an example of how to use the chunkit function
// first we import the chunkit function
// then we setup the documents array with the text files
// then we call the chunkit function with the documents array and an options object
// the options object is optional, but we are using it to set the logging to true
// and to set the maxTokenSize to 300
// and to set the onnxEmbeddingModel to "nomic-ai/nomic-embed-text-v1.5"
// and to set the onnxEmbeddingModelQuantized to true
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';

// initialize documents array
let documents = [];
let textFiles = ['./similar.txt'];

// read each text file and add it to the documents array
for (const textFile of textFiles) {
    documents.push({
        document_name: textFile,
        document_text: await fs.promises.readFile(textFile, 'utf8')
    });
}

// start timing
const startTime = performance.now();

let myTestChunks = await chunkit(
    documents,
    {
        logging: true,                         // enable to see what's happening
        maxTokenSize: 300,
        similarityThreshold: 0.65,             // increased threshold
        dynamicThresholdLowerBound: 0.5,       // increased lower bound
        dynamicThresholdUpperBound: 0.8,       // slightly increased upper bound
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,                   // enable rebalancing
        combineChunksSimilarityThreshold: 0.6, // increased threshold
        onnxEmbeddingModel: "nomic-ai/nomic-embed-text-v1.5",
        onnxEmbeddingModelQuantized: true,
        localModelPath: "../models",
        modelCacheDir: "../models",
        returnEmbedding: false,
        returnTokenLength: true,
        // chunkPrefix: "search_document",
    }
);

// end timeing
const endTime = performance.now();

// calculate tracked time in seconds
let trackedTimeSeconds = (endTime - startTime) / 1000;
trackedTimeSeconds =  parseFloat(trackedTimeSeconds.toFixed(2));

console.log("\n\n\n");
console.log("myTestChunks:");
console.log(myTestChunks);
console.log("length: " + myTestChunks.length);
console.log("trackedTimeSeconds: " + trackedTimeSeconds);