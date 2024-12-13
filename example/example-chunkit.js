// ------------------------
// -- example-chunkit.js --
// -------------------------------------------------------------------------------
// this is an example of how to use the chunkit function
// first we import the chunkit function
// then we setup the documents array with text files
// then we call the chunkit function with the documents array and an options object
// the options object is optional, use it to customize the chunking process
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';

// initialize documents array
let documents = [];
let textFiles = ['./example.txt', './different.txt', './similar.txt'];

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
        logging: false,
        maxTokenSize: 300,
        similarityThreshold: 0.500,        
        dynamicThresholdLowerBound: 0.400,  
        dynamicThresholdUpperBound: 0.800,  
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,  // enable rebalancing
        combineChunksSimilarityThreshold: 0.700,
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        dtype: "q8",
        localModelPath: "../models",
        modelCacheDir: "../models",
        returnTokenLength: true,
        returnEmbedding: false,
    }
);

// end timeing
const endTime = performance.now();

// calculate tracked time in seconds
let trackedTimeSeconds = (endTime - startTime) / 1000;
trackedTimeSeconds =  parseFloat(trackedTimeSeconds.toFixed(2));

console.log("\n\n");
console.log("myTestChunks:");
console.log(myTestChunks);
console.log("length: " + myTestChunks.length);
console.log("trackedTimeSeconds: " + trackedTimeSeconds);