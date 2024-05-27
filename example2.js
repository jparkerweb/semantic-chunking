import { cramit } from './chunkit.js';
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