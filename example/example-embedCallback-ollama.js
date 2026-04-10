// -----------------------------------
// -- example-embedCallback-ollama.js --
// -------------------------------------------------------------------------------
// Example: Using custom embedding provider (Ollama - Local & Free)
//
// This example shows how to use the embedCallback parameter with Ollama,
// a completely free and private local embedding solution.
//
// Prerequisites:
// 1. Install Ollama: https://ollama.ai
//    - macOS/Linux: curl https://ollama.ai/install.sh | sh
//    - Windows: Download from https://ollama.ai/download
// 2. Pull embedding model: ollama pull nomic-embed-text
// 3. Ensure Ollama is running (starts automatically after install)
//
// Advantages:
// - 100% free and private
// - No API keys needed
// - No rate limits
// - Works offline
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = 'nomic-embed-text';

// Test Ollama connection
async function testOllamaConnection() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) {
            throw new Error('Ollama is not responding');
        }
        const data = await response.json();
        const hasModel = data.models?.some(m => m.name.includes(OLLAMA_MODEL));
        if (!hasModel) {
            console.error(`Error: Model '${OLLAMA_MODEL}' not found`);
            console.error(`Please run: ollama pull ${OLLAMA_MODEL}`);
            process.exit(1);
        }
    } catch (error) {
        console.error('Error: Cannot connect to Ollama');
        console.error('Please ensure Ollama is installed and running:');
        console.error('  - Install: https://ollama.ai');
        console.error(`  - Pull model: ollama pull ${OLLAMA_MODEL}`);
        console.error('  - Ollama should start automatically, or run: ollama serve');
        process.exit(1);
    }
}

await testOllamaConnection();

// Custom embedding callback using Ollama
// Receives array of texts, returns array of embedding vectors
// Type signature: (texts: string[]) => Promise<number[][]>
const embedCallback = async (texts) => {
    console.log(`Embedding ${texts.length} texts via local Ollama...`);

    const embeddings = [];

    // Ollama processes one text at a time
    for (const text of texts) {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: text
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        embeddings.push(data.embedding);
    }

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
        // Use local Ollama embedding provider instead of ONNX
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
console.log("- Provider: Ollama (Local & Private)");
console.log("- Model: " + OLLAMA_MODEL);
console.log("- Note: ONNX model was NOT loaded (embedCallback used instead)");
console.log("- Note: All embeddings generated locally (no external API calls)");
