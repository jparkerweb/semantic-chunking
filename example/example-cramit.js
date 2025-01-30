// -----------------------
// -- example-cramit.js --
// --------------------------------------------------------------------------------
// this is an example of how to use the cramit function
// first we import the cramit function
// then we setup the documents array with a text
// then we call the cramit function with the text and an options object
// the options object is optional
//
// the cramit function is faster than the chunkit function, but it is less accurate
// useful for quickly chunking text, but not for exact semantic chunking
// --------------------------------------------------------------------------------

import { cramit } from '../chunkit.js'; // this is typically just "import { cramit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// initialize documents array
let documents = [];
let textFiles = ['example3.txt'].map(file => 
    resolve(__dirname, file)
);

// read each text file and add it to the documents array
for (const textFile of textFiles) {
    documents.push({
        document_name: textFile,
        document_text: await fs.promises.readFile(textFile, 'utf8')
    });
}

// start timing
const startTime = performance.now();

let myTestChunks = await cramit(
    documents,
    {
        logging: false,
        maxTokenSize: 300,
        onnxEmbeddingModel: "nomic-ai/nomic-embed-text-v1.5",
        onnxEmbeddingModelQuantized: true,
        localModelPath: "../models",
        modelCacheDir: "../models",
        returnEmbedding: false,
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