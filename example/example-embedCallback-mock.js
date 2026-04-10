// ---------------------------------
// -- example-embedCallback-mock.js --
// -------------------------------------------------------------------------------
// Example: Using custom embedding provider (Mock - For Testing)
//
// This example demonstrates the embedCallback API with mock embeddings.
// Useful for testing functionality without requiring any external API.
//
// Prerequisites:
// - None! This example works completely offline with no dependencies.
//
// Use Cases:
// - Testing embedCallback functionality
// - Development without API keys
// - CI/CD pipeline tests
// - Understanding the embedCallback interface
//
// Note: Mock embeddings are deterministic but not semantically meaningful.
//       Use real embedding providers for production use.
// -------------------------------------------------------------------------------

import { chunkit } from '../chunkit.js'; // this is typically just "import { chunkit } from 'semantic-chunking';", but this is a local test
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock embedding generator
// Generates deterministic pseudo-random embeddings for consistent testing
// Custom embedding callback using mock embeddings
// Receives array of texts, returns array of embedding vectors
// Type signature: (texts: string[]) => Promise<number[][]>
const embedCallback = async (texts) => {
    console.log(`Generating mock embeddings for ${texts.length} texts...`);

    // Simulate network delay (optional, for realistic testing)
    await new Promise(resolve => setTimeout(resolve, 100));

    return texts.map((text, textIndex) => {
        const embedding = [];

        // Use text properties as seeds for deterministic generation
        const lengthSeed = text.length;
        const charSeed = text.charCodeAt(0) || 1;
        const wordCount = text.split(/\s+/).length;

        // Generate 384-dimensional embeddings (standard for MiniLM models)
        for (let i = 0; i < 384; i++) {
            // Create pseudo-random but deterministic values
            // Values will be similar for similar text lengths/content
            const value = (
                Math.sin(lengthSeed * i * 0.01) * 0.3 +
                Math.cos(charSeed * i * 0.02) * 0.3 +
                Math.sin(wordCount * i * 0.015) * 0.2 +
                Math.cos(textIndex * i * 0.005) * 0.2
            );

            embedding.push(value);
        }

        // Normalize the embedding vector (standard practice)
        const magnitude = Math.sqrt(
            embedding.reduce((sum, val) => sum + val * val, 0)
        );

        return embedding.map(val => val / magnitude);
    });
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
        // Use mock embedding provider instead of ONNX
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
console.log("- Provider: Mock Embeddings (Testing Only)");
console.log("- Embedding dimension: 384");
console.log("- Note: ONNX model was NOT loaded (embedCallback used instead)");
console.log("- Note: Mock embeddings are deterministic but not semantically meaningful");
console.log("\n✓ embedCallback functionality verified!");
