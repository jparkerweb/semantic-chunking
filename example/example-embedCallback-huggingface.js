// ----------------------------------------
// -- example-embedCallback-huggingface.js --
// -------------------------------------------------------------------------------
// Example: Using custom embedding provider (Hugging Face Inference API)
//
// This example shows how to use the embedCallback parameter with Hugging Face's
// FREE Inference API - no credit card required!
//
// Prerequisites:
// - Get free API key: https://huggingface.co/settings/tokens
// - Set HF_API_KEY environment variable
//
// Advantages:
// - Completely free tier (no payment required)
// - Many embedding models available
// - Easy to get started
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Hugging Face API configuration
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

if (!HF_API_KEY) {
    console.error('Error: HF_API_KEY environment variable not set');
    console.error('Get your free API key from: https://huggingface.co/settings/tokens');
    console.error('Then run: export HF_API_KEY=your_token_here');
    process.exit(1);
}

// Custom embedding callback using Hugging Face
// Receives array of texts, returns array of embedding vectors
// Type signature: (texts: string[]) => Promise<number[][]>
const embedCallback = async (texts) => {
    console.log(`Embedding ${texts.length} texts via Hugging Face (FREE)...`);

    const response = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: texts,
                options: { wait_for_model: true }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hugging Face API error: ${response.statusText} - ${error}`);
    }

    const embeddings = await response.json();
    return embeddings;
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
        // Use Hugging Face embedding provider instead of ONNX
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
console.log("- Provider: Hugging Face Inference API (FREE)");
console.log("- Model: " + HF_MODEL);
console.log("- Note: ONNX model was NOT loaded (embedCallback used instead)");
