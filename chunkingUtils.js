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
        const currentChunkText = currentChunk.join(" ");
        const currentChunkSize = tokenizer(currentChunkText).input_ids.size;
        const nextSentence = sentences[i];
        const nextSentenceTokenCount = tokenizer(nextSentence).input_ids.size;
        
        // For cramit (when similarities is null), only check token size
        if (!similarities) {
            if (currentChunkSize + nextSentenceTokenCount <= maxTokenSize) {
                currentChunk.push(nextSentence);
            } else {
                chunks.push(currentChunkText);
                currentChunk = [nextSentence];
            }
            continue;
        }

        // Regular chunkit logic with similarities
        if (currentChunkSize + nextSentenceTokenCount > maxTokenSize) {
            if (logging) console.log('Chunk size limit reached:', currentChunkSize);
            chunks.push(currentChunkText);
            currentChunk = [nextSentence];
            continue;
        }

        if (similarities[i - 1] >= similarityThreshold) {
            if (logging) {
                console.log(`Adding sentence ${i} with similarity ${similarities[i - 1]}`);
            }
            currentChunk.push(nextSentence);
        } else {
            if (logging) {
                console.log(`Starting new chunk at sentence ${i}, similarity was ${similarities[i - 1]}`);
            }
            chunks.push(currentChunkText);
            currentChunk = [nextSentence];
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
