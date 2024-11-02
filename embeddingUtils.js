import { env, pipeline, AutoTokenizer } from '@xenova/transformers';

let tokenizer;
let generateEmbedding;
const embeddingCache = new Map();

// --------------------------------------------
// -- Initialize embedding model and tokenizer --
// --------------------------------------------
export async function initializeEmbeddingUtils(onnxEmbeddingModel, onnxEmbeddingModelQuantized) {
    env.allowRemoteModels = true;
    tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel);
    generateEmbedding = await pipeline('feature-extraction', onnxEmbeddingModel, {
        quantized: onnxEmbeddingModelQuantized,
    });

    return {
        modelName: onnxEmbeddingModel,
        isQuantized: onnxEmbeddingModelQuantized
    };
}

// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
export async function createEmbedding(text) {
    if (embeddingCache.has(text)) return embeddingCache.get(text);

    const embeddings = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    embeddingCache.set(text, embeddings.data);
    return embeddings.data;
}

export { tokenizer };