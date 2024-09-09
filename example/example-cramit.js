// -----------------------
// -- example-cramit.js --
// --------------------------------------------------------------------------------
// this is an example of how to use the cramit function
// first we import the cramit function from the chunkit.js file
// then we read the text from the example.txt file
// then we call the cramit function with the text and an options object
// the options object is optional, but we are using it to set the logging to true
// and to set the maxTokenSize to 300
// and to set the onnxEmbeddingModel to "Xenova/all-MiniLM-L6-v2"
// and to set the onnxEmbeddingModelQuantized to true
//
// the cramit function is faster than the chunkit function, but it is less accurate
// --------------------------------------------------------------------------------

import { cramit } from '../chunkit.js'; // this is typically just "import { cramit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';

const text = await fs.promises.readFile('./example.txt', 'utf8');

// start timing
const startTime = performance.now();

let myTestChunks = await cramit(
    text,
    {
        logging: true,
        maxTokenSize: 300,
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
    }
);

// end timeing
const endTime = performance.now();

// calculate tracked time in seconds
let trackedTimeSeconds = (endTime - startTime) / 1000;
trackedTimeSeconds =  parseFloat(trackedTimeSeconds.toFixed(2));

console.log("\n\n\n");
// console.log("myTestChunks:");
// console.log(myTestChunks);
console.log("length: " + myTestChunks.length);
console.log("trackedTimeSeconds: " + trackedTimeSeconds);