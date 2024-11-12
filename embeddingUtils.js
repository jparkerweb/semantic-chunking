import { env, pipeline, AutoTokenizer } from '@huggingface/transformers';

let tokenizer;
let generateEmbedding;
const embeddingCache = new Map();

// --------------------------------------------
// -- Initialize embedding model and tokenizer --
// --------------------------------------------
export async function initializeEmbeddingUtils(
    onnxEmbeddingModel, 
    dtype = 'fp32',
    localModelPath = null,
    modelCacheDir = null
) {
    // Configure environment
    env.allowRemoteModels = true;
    if (localModelPath) env.localModelPath = localModelPath;
    if (modelCacheDir) env.cacheDir = modelCacheDir;

    tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel);
    generateEmbedding = await pipeline('feature-extraction', onnxEmbeddingModel, {
        dtype: dtype,
    });

    embeddingCache.clear();

    return {
        modelName: onnxEmbeddingModel,
        dtype: dtype
    };
}

// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
export async function createEmbedding(text) {
    if (embeddingCache.has(text)) {
        return embeddingCache.get(text);
    }

    const embeddings = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    embeddingCache.set(text, embeddings.data);
    return embeddings.data;
}

export { tokenizer };