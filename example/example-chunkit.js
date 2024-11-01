// ------------------------
// -- example-chunkit.js --
// -------------------------------------------------------------------------------
// this is an example of how to use the chunkit function
// first we import the chunkit function from the chunkit.js file
// then we read the text from the example.txt file
// then we call the chunkit function with the text and an options object
// the options object is optional, but we are using it to set the logging to true
// and to set the maxTokenSize to 300
// and to set the onnxEmbeddingModel to "Xenova/all-MiniLM-L6-v2"
// and to set the onnxEmbeddingModelQuantized to true
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';

const text = await fs.promises.readFile('./example.txt', 'utf8');

// start timing
const startTime = performance.now();

let myTestChunks = await chunkit(
    text,
    {
        logging: true,
        maxTokenSize: 300,
        similarityThreshold: .577,             // higher value requires higher similarity to be included (less inclusive)
        dynamicThresholdLowerBound: .2,        // lower bound for dynamic threshold
        dynamicThresholdUpperBound: .9,        // upper bound for dynamic threshold
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.3, // lower value will combine more chunks (more inclusive)
        onnxEmbeddingModel: "nomic-ai/nomic-embed-text-v1.5",
        onnxEmbeddingModelQuantized: true,
        localModelPath: "../models",
        modelCacheDir: "../models",
        returnEmbedding: true,
        returnTokenLength: true,
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