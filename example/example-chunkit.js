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

// initialize documents array
let documents = [];
let textFiles = ['./example.txt', './example2.txt'];

// read each text file and add it to the documents array
for (const textFile of textFiles) {
    documents.push({
        document_name: textFile,
        document_text: await fs.promises.readFile(textFile, 'utf8')
    });
}

// add some sample text to the documents array
documents.push({
    document_name: "sample text",
    document_text: "This is a sample text to test the chunkit function."
});

// start timing
const startTime = performance.now();

let myTestChunks = await chunkit(
    documents,
    {
        logging: false,
        maxTokenSize: 300,
        similarityThreshold: .411,             // higher value requires higher similarity to be included (less inclusive)
        dynamicThresholdLowerBound: .3,        // lower bound for dynamic threshold
        dynamicThresholdUpperBound: .7,        // upper bound for dynamic threshold
        numSimilaritySentencesLookahead: 3,
        combineChunks: false,
        combineChunksSimilarityThreshold: 0.45, // lower value will combine more chunks (more inclusive)
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