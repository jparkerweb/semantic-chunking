import { env, pipeline, AutoTokenizer } from '@huggingface/transformers';
import { LRUCache } from 'lru-cache';

let tokenizer;
let generateEmbedding;
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
    // Configure environment
    env.allowRemoteModels = true;
    if (localModelPath) env.localModelPath = localModelPath;
    if (modelCacheDir) env.cacheDir = modelCacheDir;

    // Only initialize tokenizer, not the embedding pipeline
    tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel);

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
    // Configure environment
    env.allowRemoteModels = true;
    if (localModelPath) env.localModelPath = localModelPath;
    if (modelCacheDir) env.cacheDir = modelCacheDir;

    tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel);
    const pipelineOptions = {
        dtype: dtype,
    };

    if (device !== 'webgpu') {
        pipelineOptions.device = device;
    }

    generateEmbedding = await pipeline('feature-extraction', onnxEmbeddingModel, pipelineOptions);

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
    const cached = embeddingCache.get(text);
    if (cached) {
        return cached;
    }

    const embeddings = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    embeddingCache.set(text, embeddings.data);
    return embeddings.data;
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
    const pipe = pipelineInstance || generateEmbedding;
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

    // Process uncached texts in batch
    if (uncachedTexts.length > 0) {
        for (let j = 0; j < uncachedTexts.length; j++) {
            const text = uncachedTexts[j];
            const embeddings = await pipe(text, { pooling: 'mean', normalize: true });
            const embeddingData = embeddings.data;
            embeddingCache.set(text, embeddingData);
            results[uncachedIndices[j]] = embeddingData;
        }
    }

    return results;
}

export { tokenizer, embeddingCache };