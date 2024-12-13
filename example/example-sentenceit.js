// -----------------------
// -- example-sentenceit.js --
// --------------------------------------------------------------------------------
// this is an example of how to use the sentenceit function
// first we import the sentenceit function
// then we setup the documents array with a text
// then we call the sentenceit function with the text and an options object
// the options object is optional
//
// the cramit function is faster than the chunkit function, but it is less accurate
// useful for quickly chunking text, but not for exact semantic chunking
// --------------------------------------------------------------------------------

import { sentenceit } from '../chunkit.js'; // this is typically just "import { sentenceit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';

// initialize documents array
let documents = [];
let textFiles = ['./example3.txt'];

// read each text file and add it to the documents array
for (const textFile of textFiles) {
    documents.push({
        document_name: textFile,
        document_text: await fs.promises.readFile(textFile, 'utf8')
    });
}

// start timing
const startTime = performance.now();

let myTestSentences = await sentenceit(
    documents,
    {
        logging: false,
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        dtype: 'fp32',
        localModelPath: "../models",
        modelCacheDir: "../models",
        returnEmbedding: true,
    }
);

// end timeing
const endTime = performance.now();

// calculate tracked time in seconds
let trackedTimeSeconds = (endTime - startTime) / 1000;
trackedTimeSeconds =  parseFloat(trackedTimeSeconds.toFixed(2));

console.log("\n\n\n");
console.log("myTestSentences:");
console.log(myTestSentences);
console.log("length: " + myTestSentences.length);
console.log("trackedTimeSeconds: " + trackedTimeSeconds);