import { tokenizer } from './embeddingUtils.js';
import { cosineSimilarity } from './similarityUtils.js';
import { createEmbedding } from './embeddingUtils.js';

// -----------------------------------------------------------
// -- Linked List Node for Multi-Pass Merge Algorithm --
// -----------------------------------------------------------

/**
 * Creates a linked list node for merge algorithm
 * @param {string} text - Chunk text content
 * @param {number[]} embedding - Embedding vector (or null if not yet computed)
 * @param {number} tokenCount - Token count for this chunk
 * @returns {Object} Linked list node
 */
function createMergeNode(text, embedding, tokenCount) {
  return {
    text,
    embedding,
    tokenCount,
    prev: null,
    next: null,
    processed: false
  };
}

/**
 * Builds a doubly-linked list from an array of chunks
 * @param {Object[]} chunks - Array of chunk objects with text and tokenCount
 * @param {Map} embeddingsMap - Map of text to embedding vectors
 * @returns {Object|null} Head node of linked list, or null if empty
 */
function buildLinkedList(chunks, embeddingsMap) {
  if (!chunks || chunks.length === 0) return null;

  let head = null;
  let prev = null;

  for (const chunk of chunks) {
    const node = createMergeNode(
      chunk.text,
      embeddingsMap?.get(chunk.text) || null,
      chunk.tokenCount
    );

    if (!head) head = node;
    if (prev) {
      prev.next = node;
      node.prev = prev;
    }
    prev = node;
  }

  return head;
}

/**
 * Converts a linked list back to an array of chunk objects
 * @param {Object|null} head - Head node of linked list
 * @returns {Object[]} Array of chunk objects with text, tokenCount, embedding
 */
function linkedListToChunks(head) {
  const chunks = [];
  let current = head;

  while (current) {
    chunks.push({
      text: current.text,
      tokenCount: current.tokenCount,
      embedding: current.embedding
    });
    current = current.next;
  }

  return chunks;
}

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
        const nextSentence = sentences[i];
        
        // For cramit (when similarities is null), only check token size
        if (!similarities) {
            const currentChunkText = currentChunk.join(" ");
            const currentChunkSize = tokenizer(currentChunkText).input_ids.size;
            const nextSentenceTokenCount = tokenizer(nextSentence).input_ids.size;
            
            if (currentChunkSize + nextSentenceTokenCount <= maxTokenSize) {
                currentChunk.push(nextSentence);
            } else {
                chunks.push(currentChunkText);
                currentChunk = [nextSentence];
            }
            continue;
        }

        // Check similarity first for chunkit
        if (similarities[i - 1] >= similarityThreshold) {
            if (logging) {
                console.log(`Adding sentence ${i} with similarity ${similarities[i - 1]}`);
            }
            
            // Then check token size
            const currentChunkText = currentChunk.join(" ");
            const currentChunkSize = tokenizer(currentChunkText).input_ids.size;
            const nextSentenceTokenCount = tokenizer(nextSentence).input_ids.size;
            
            if (currentChunkSize + nextSentenceTokenCount <= maxTokenSize) {
                currentChunk.push(nextSentence);
            } else {
                chunks.push(currentChunkText);
                currentChunk = [nextSentence];
            }
        } else {
            if (logging) {
                console.log(`Starting new chunk at sentence ${i}, similarity was ${similarities[i - 1]}`);
            }
            chunks.push(currentChunk.join(" "));
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
