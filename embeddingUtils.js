import { createLocalProvider, createTokenizer } from 'embedding-utils';
import { LRUCache } from 'lru-cache';

let provider;
let tk;
const embeddingCache = new LRUCache({
    max: 500,
    maxSize: 50_000_000,
    sizeCalculation: (value, key) => {
        return (value.length * 4) + key.length;
    },
    ttl: 1000 * 60 * 60,
});

// --------------------------------------------
// -- Initialize tokenizer only (for embedCallback use) --
// --------------------------------------------
export async function initializeTokenizer(
    onnxEmbeddingModel,
    localModelPath = null,
    modelCacheDir = null
) {
    // Only initialize the tokenizer, not the embedding provider
    tk = createTokenizer(onnxEmbeddingModel, {
        modelPath: localModelPath,
        cacheDir: modelCacheDir,
    });
    await tk.load();

    return {
        modelName: onnxEmbeddingModel,
    };
}

// --------------------------------------------
// -- Initialize embedding model and tokenizer --
// --------------------------------------------
export async function initializeEmbeddingUtils(
    onnxEmbeddingModel,
    dtype = 'fp32',
    device = 'cpu',
    localModelPath = null,
    modelCacheDir = null
) {
    // Build the local ONNX embedding provider via embedding-utils.
    // Pooling is resolved from eu's model registry ('mean' for the default
    // Xenova/all-MiniLM-L6-v2); 'mean' is passed explicitly to guarantee
    // parity with the former generateEmbedding({ pooling: 'mean' }) call.
    provider = createLocalProvider({
        model: onnxEmbeddingModel,
        precision: dtype,
        device: device,
        modelPath: localModelPath,
        cacheDir: modelCacheDir,
        pooling: 'mean',
    });

    // Create and load the tokenizer used for token counting.
    tk = createTokenizer(onnxEmbeddingModel, {
        modelPath: localModelPath,
        cacheDir: modelCacheDir,
    });
    await tk.load();

    embeddingCache.clear();

    return {
        modelName: onnxEmbeddingModel,
        dtype: dtype,
        device: device,
    };
}

// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
export async function createEmbedding(text) {
    const results = await createEmbeddingBatch([text]);
    return results[0];
}

// ---------------------------------------------------
// -- Wrap user callback with cache for efficiency --
// ---------------------------------------------------
export function wrapCallbackWithCache(embedCallback, cache) {
    return async function cachedCallback(texts) {
        const results = new Array(texts.length);
        const uncachedIndices = [];
        const uncachedTexts = [];

        // Check cache for each text
        for (let i = 0; i < texts.length; i++) {
            const cached = cache.get(texts[i]);
            if (cached) {
                results[i] = cached;
            } else {
                uncachedIndices.push(i);
                uncachedTexts.push(texts[i]);
            }
        }

        // Call original callback only for uncached texts
        if (uncachedTexts.length > 0) {
            const embeddings = await embedCallback(uncachedTexts);
            for (let j = 0; j < uncachedTexts.length; j++) {
                const embedding = embeddings[j];
                cache.set(uncachedTexts[j], embedding);
                results[uncachedIndices[j]] = embedding;
            }
        }

        return results;
    };
}

// ------------------------------------------------
// -- Validate callback return value shape --
// ------------------------------------------------
export function validateEmbeddingResult(texts, embeddings) {
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
        throw new Error(`embedCallback must return an array of embeddings matching input length. Expected ${texts.length}, got ${embeddings?.length}`);
    }
    for (let i = 0; i < embeddings.length; i++) {
        const embedding = embeddings[i];
        if (!Array.isArray(embedding) && !(embedding instanceof Float32Array) && !(embedding instanceof Float64Array)) {
            throw new Error(`embedCallback must return an array of embeddings. Item at index ${i} is not an array.`);
        }
        // Check if elements are numbers (sample first few for performance)
        const checkCount = Math.min(embedding.length, 3);
        for (let j = 0; j < checkCount; j++) {
            if (typeof embedding[j] !== 'number' || Number.isNaN(embedding[j])) {
                throw new Error(`embedCallback embeddings must contain numbers. Found invalid value at index ${i}[${j}].`);
            }
        }
    }
}

// ------------------------------------------------
// -- Function to generate embeddings in batches --
// ------------------------------------------------
export async function createEmbeddingBatch(texts, pipelineInstance = null, tokenizerInstance = null, options = {}) {
    const embedProvider = pipelineInstance || provider;
    const results = new Array(texts.length);
    const uncachedIndices = [];
    const uncachedTexts = [];

    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
        const cached = embeddingCache.get(texts[i]);
        if (cached) {
            results[i] = cached;
        } else {
            uncachedIndices.push(i);
            uncachedTexts.push(texts[i]);
        }
    }

    // Process uncached texts in a single batch via the eu provider
    if (uncachedTexts.length > 0) {
        const { embeddings } = await embedProvider.embed(uncachedTexts);
        for (let j = 0; j < uncachedTexts.length; j++) {
            const embeddingData = embeddings[j];
            embeddingCache.set(uncachedTexts[j], embeddingData);
            results[uncachedIndices[j]] = embeddingData;
        }
    }

    return results;
}

// ------------------------------------------------
// -- Token counting (delegates to eu tokenizer) --
// ------------------------------------------------
export function countTokens(text) {
    return tk.count(text);
}

export function countTokensBatch(texts) {
    return tk.countBatch(texts);
}

export { embeddingCache };
