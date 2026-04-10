// ------------------------------
// -- example-embedCallback-openai.js --
// -------------------------------------------------------------------------------
// Example: Using custom embedding provider (OpenAI)
//
// This example shows how to use the embedCallback parameter
// to integrate external embedding providers instead of using the local ONNX model.
//
// Prerequisites:
// - npm install openai
// - Set OPENAI_API_KEY environment variable
//
// When embedCallback is provided:
// - The local ONNX model is NOT initialized (faster startup)
// - All embedding requests are routed through your callback
// - The callback receives batched texts for efficiency
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import OpenAI from 'openai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client (requires OPENAI_API_KEY env var)
const openai = new OpenAI();

// Custom embedding callback
// Receives array of texts, returns array of embedding vectors
// Type signature: (texts: string[]) => Promise<number[][]>
const embedCallback = async (texts) => {
    console.log(`Embedding ${texts.length} texts via OpenAI...`);
    const response = await openai.embeddings.create({
        input: texts,
        model: 'text-embedding-3-small'
    });
    return response.data.map(d => d.embedding);
};

// Initialize documents array
let documents = [];
let textFiles = ['example.txt', 'different.txt', 'similar.txt'].map(file =>
    resolve(__dirname, file)
);

// Read each text file and add it to the documents array
for (const textFile of textFiles) {
    documents.push({
        document_name: textFile,
        document_text: await fs.promises.readFile(textFile, 'utf8')
    });
}

// Start timing
const startTime = performance.now();

let myTestChunks = await chunkit(
    documents,
    {
        logging: true,
        maxTokenSize: 300,
        similarityThreshold: 0.500,
        dynamicThresholdLowerBound: 0.400,
        dynamicThresholdUpperBound: 0.800,
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.700,
        returnTokenLength: true,
        returnEmbedding: false,
        // Use custom embedding provider instead of ONNX
        embedCallback: embedCallback,
    }
);

// End timing
const endTime = performance.now();

// Calculate tracked time in seconds
let trackedTimeSeconds = (endTime - startTime) / 1000;
trackedTimeSeconds = parseFloat(trackedTimeSeconds.toFixed(2));

console.log("\nmyTestChunks:");
console.log(myTestChunks);
console.log("\nSummary:");
console.log("- Chunks created: " + myTestChunks.length);
console.log("- Time: " + trackedTimeSeconds + " seconds");
console.log("- Note: ONNX model was NOT loaded (embedCallback used instead)");
