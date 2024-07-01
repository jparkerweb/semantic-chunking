import { chunkit } from './chunkit.js';
import fs from 'fs';

const fp = "data/docs/human-agents.txt";

const text = await fs.promises.readFile(fp, 'utf8');

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
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
    }
);

// end timeing
const endTime = performance.now();

// calculate tracked time in seconds
let trackedTimeSeconds = (endTime - startTime) / 1000;
trackedTimeSeconds = parseFloat(trackedTimeSeconds.toFixed(2));

console.log("\n\n\n");
// console.log("myTestChunks:");
// console.log(myTestChunks);
console.log("length: " + myTestChunks.length);
console.log("trackedTimeSeconds: " + trackedTimeSeconds);