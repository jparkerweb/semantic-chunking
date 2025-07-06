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

export { tokenizer };