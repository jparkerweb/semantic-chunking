import { tokenizer } from './embeddingUtils.js';
import { cosineSimilarity } from './similarityUtils.js';
import { createEmbedding } from './embeddingUtils.js';

// -----------------------------------------------------------
// -- Function to create chunks of text based on similarity --
// -----------------------------------------------------------
export function createChunks(sentences, similarities, maxTokenSize, similarityThreshold, logging) {
    let chunks = [];
    let currentChunk = [sentences[0]];
    
    if (logging) {
        console.log('Initial sentence:', sentences[0]);
    }

    for (let i = 1; i < sentences.length; i++) {
        const currentChunkSize = tokenizer(currentChunk.join(" ")).input_ids.size;
        const sentenceTokenCount = tokenizer(sentences[i]).input_ids.size;
        
        // Never split if it would exceed maxTokenSize
        if (currentChunkSize + sentenceTokenCount > maxTokenSize) {
            if (logging) console.log('Chunk size limit reached:', currentChunkSize);
            chunks.push(currentChunk.join(" "));
            currentChunk = [sentences[i]];
            continue;
        }

        // Only combine if similarity threshold is met
        if (similarities && similarities[i - 1] >= similarityThreshold) {
            if (logging) {
                console.log(`Adding sentence ${i} with similarity ${similarities[i - 1]}`);
            }
            currentChunk.push(sentences[i]);
        } else {
            if (logging) {
                console.log(`Starting new chunk at sentence ${i}, similarity was ${similarities ? similarities[i - 1] : 'N/A'}`);
            }
            chunks.push(currentChunk.join(" "));
            currentChunk = [sentences[i]];
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
    }

    return chunks;
}

// --------------------------------------------------------------
// -- Optimize and Rebalance Chunks (optionally use Similarity) --
// --------------------------------------------------------------
export async function optimizeAndRebalanceChunks(combinedChunks, tokenizer, maxTokenSize, combineChunksSimilarityThreshold = 0.5) {
    let optimizedChunks = [];
    let currentChunkText = "";
    let currentChunkTokenCount = 0;
    let currentEmbedding = null;

    for (let index = 0; index < combinedChunks.length; index++) {
        const chunk = combinedChunks[index];
        const chunkTokenCount = tokenizer(chunk).input_ids.size;

        if (currentChunkText && (currentChunkTokenCount + chunkTokenCount <= maxTokenSize)) {
            const nextEmbedding = await createEmbedding(chunk);
            const similarity = currentEmbedding ? cosineSimilarity(currentEmbedding, nextEmbedding) : 0;

            if (similarity >= combineChunksSimilarityThreshold) {
                currentChunkText += " " + chunk;
                currentChunkTokenCount += chunkTokenCount;
                currentEmbedding = nextEmbedding;
                continue;
            }
        }

        if (currentChunkText) optimizedChunks.push(currentChunkText);
        currentChunkText = chunk;
        currentChunkTokenCount = chunkTokenCount;
        currentEmbedding = await createEmbedding(chunk);
    }

    if (currentChunkText) optimizedChunks.push(currentChunkText);

    return optimizedChunks.filter(chunk => chunk);
}


// ------------------------------------------------
// -- Helper function to apply prefix to a chunk --
// ------------------------------------------------
export function applyPrefixToChunk(chunkPrefix, chunk) {
    if (chunkPrefix && chunkPrefix.trim()) {
        return `${chunkPrefix}: ${chunk}`;
    }
    return chunk;
};
