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
// -- Merge Candidate Logic --
// -----------------------------------------------------------

/**
 * Evaluates if two adjacent nodes can be merged
 * @param {Object} node - First node
 * @param {Object} nextNode - Second node (node.next)
 * @param {number} maxTokens - Maximum tokens per chunk
 * @param {number} similarityThreshold - Minimum similarity to merge
 * @returns {Object|null} Merge candidate or null if not mergeable
 */
function _getMergeCandidate(node, nextNode, maxTokens, similarityThreshold) {
  if (!node || !nextNode) return null;

  const combinedSize = node.tokenCount + nextNode.tokenCount;
  if (combinedSize > maxTokens) return null;

  // Compute similarity between adjacent chunks
  const similarity = cosineSimilarity(node.embedding, nextNode.embedding);
  if (similarity < similarityThreshold) return null;

  return {
    node,
    nextNode,
    similarity,
    combinedSize
  };
}

/**
 * Collects all valid merge candidates from the linked list
 * @param {Object} head - Head node of linked list
 * @param {number} maxTokens - Maximum tokens per chunk
 * @param {number} similarityThreshold - Minimum similarity to merge
 * @returns {Object[]} Array of merge candidate objects
 */
function collectMergeCandidates(head, maxTokens, similarityThreshold) {
  const candidates = [];
  let current = head;

  while (current && current.next) {
    const candidate = _getMergeCandidate(
      current,
      current.next,
      maxTokens,
      similarityThreshold
    );
    if (candidate) {
      candidates.push(candidate);
    }
    current = current.next;
  }

  return candidates;
}

// -----------------------------------------------------------
// -- Multi-Pass Merge Algorithm Core --
// -----------------------------------------------------------

/**
 * Executes a single merge operation between two adjacent nodes
 * @param {Object} candidate - Merge candidate with node, nextNode, combinedSize
 * @returns {Object} The merged node
 */
function executeMerge(candidate) {
  const { node, nextNode } = candidate;

  // Combine text
  node.text = node.text + ' ' + nextNode.text;
  node.tokenCount = candidate.combinedSize;

  // Clear embedding (will be recomputed if needed)
  node.embedding = null;

  // Update linked list pointers
  node.next = nextNode.next;
  if (nextNode.next) {
    nextNode.next.prev = node;
  }

  // Mark as processed this pass
  node.processed = true;

  return node;
}

/**
 * Recomputes embeddings for merged nodes and resets processed flags
 * @param {Object[]} mergedNodes - Array of nodes that were merged this pass
 * @param {Function} embedBatch - Batch embedding function
 * @returns {Promise<void>}
 */
async function refreshMergedEmbeddings(mergedNodes, embedBatch) {
  if (mergedNodes.length === 0) return;

  const texts = mergedNodes.map(node => node.text);
  const embeddings = await embedBatch(texts);

  mergedNodes.forEach((node, index) => {
    node.embedding = embeddings[index];
    node.processed = false; // Reset for next pass
  });
}

/**
 * Determines how many merges to perform in a single pass
 * @param {number} candidateCount - Number of available merge candidates
 * @param {Object} options - Merge throttling options
 * @param {number} options.maxMergesPerPass - Absolute maximum merges per pass
 * @param {number} options.maxMergesPerPassPercentage - Percentage of candidates to merge
 * @param {number} options.uncappedCandidateMerges - Below this count, allow all merges
 * @returns {number} Number of merges to perform this pass
 */
function calculateMergeLimit(candidateCount, options) {
  const {
    maxMergesPerPass,
    maxMergesPerPassPercentage,
    uncappedCandidateMerges
  } = options;

  // Soft minimum: if few candidates, allow all
  if (candidateCount <= uncappedCandidateMerges) {
    return candidateCount;
  }

  // Percentage cap
  const percentageLimit = Math.floor(candidateCount * maxMergesPerPassPercentage / 100);

  // Absolute cap
  return Math.min(percentageLimit, maxMergesPerPass);
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
