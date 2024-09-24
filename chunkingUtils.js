import { tokenizer } from './embeddingUtils.js';
import { cosineSimilarity } from './similarityUtils.js';
import { createEmbedding } from './embeddingUtils.js';

// -----------------------------------------------------------
// -- Function to create chunks of text based on similarity --
// -----------------------------------------------------------
export function createChunks(sentences, similarities, maxTokenSize, similarityThreshold, logging) {
    let chunks = [];
    let currentChunk = [sentences[0]];
    let currentChunkSize;
    let sentenceTokenCount;

    if (logging) { console.log(`!! new chunk !! --> 1`) }

    for (let i = 1; i < sentences.length; i++) {
        currentChunkSize = tokenizer(currentChunk.join(" ")).input_ids.size;
        sentenceTokenCount = tokenizer(sentences[i]).input_ids.size;

        if (logging) {
            console.log('sentenceTokenCount', sentenceTokenCount);
            console.log('currentChunkSize', currentChunkSize);
            console.log('maxTokenSize', maxTokenSize);
            if (similarities) {
                console.log('similarity', similarities[i - 1])
                console.log('similarityThreshold', similarityThreshold)
            }
        }

        if (similarities) {
            if (similarities[i - 1] >= similarityThreshold && currentChunkSize + sentenceTokenCount <= maxTokenSize) {
                currentChunk.push(sentences[i]);
                if (logging) { console.log('keep going...') }
            } else {
                chunks.push(currentChunk.join(" "));
                currentChunk = [sentences[i]];
                if (logging) {
                    console.log('stop...')
                    console.log('\n')
                    console.log(`!! new chunk !! --> ${chunks.length + 1}`)
                }
            }
        } else {
            if (currentChunkSize + sentenceTokenCount <= maxTokenSize) {
                currentChunk.push(sentences[i]);
                if (logging) { console.log('keep going...') }
            } else {
                chunks.push(currentChunk.join(" "));
                currentChunk = [sentences[i]];
                if (logging) {
                    console.log('stop...')
                    console.log('\n')
                    console.log(`!! new chunk !! --> ${chunks.length + 1}`)
                }
            }
        }
    }

    if (currentChunk.length > 0 && currentChunk[0] !== "") {
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