// ===========================
// == 🍱 semantic-chunking ==
// ==================================================================
// == Semantically create chunks from large texts                  ==
// == Useful for workflows involving large language models (LLMs)  ==
// ==================================================================
// == npm package: https://www.npmjs.com/package/semantic-chunking ==
// == github repo: https://github.com/jparkerweb/semantic-chunking ==
// ==================================================================

import { env } from '@xenova/transformers';
import sentencize from '@stdlib/nlp-sentencize';
import { DEFAULT_CONFIG } from './config.js';
import { initializeEmbeddingUtils, tokenizer } from './embeddingUtils.js';
import { computeAdvancedSimilarities, adjustThreshold } from './similarityUtils.js';
import { createChunks, optimizeAndRebalanceChunks } from './chunkingUtils.js';

// ---------------------------
// -- Main chunkit function --
// ---------------------------
export async function chunkit(
    text,
    {
        logging = DEFAULT_CONFIG.LOGGING,
        maxTokenSize = DEFAULT_CONFIG.MAX_TOKEN_SIZE,
        similarityThreshold = DEFAULT_CONFIG.SIMILARITY_THRESHOLD,
        dynamicThresholdLowerBound = DEFAULT_CONFIG.DYNAMIC_THRESHOLD_LOWER_BOUND,
        dynamicThresholdUpperBound = DEFAULT_CONFIG.DYNAMIC_THRESHOLD_UPPER_BOUND,
        numSimilaritySentencesLookahead = DEFAULT_CONFIG.NUM_SIMILARITY_SENTENCES_LOOKAHEAD,
        combineChunks = DEFAULT_CONFIG.COMBINE_CHUNKS,
        combineChunksSimilarityThreshold = DEFAULT_CONFIG.COMBINE_CHUNKS_SIMILARITY_THRESHOLD,
        onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
        onnxEmbeddingModelQuantized = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL_QUANTIZED,
        localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
        modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
    } = {}) {

    // Set env variables if provided
    if (localModelPath) env.localModelPath = localModelPath;
    if (modelCacheDir) env.cacheDir = modelCacheDir;

    // Initialize embedding utilities
    await initializeEmbeddingUtils(onnxEmbeddingModel, onnxEmbeddingModelQuantized);

    // Split the text into sentences
    const sentences = sentencize(text);

    // Compute the similarities between sentences
    const { similarities, average, variance } = await computeAdvancedSimilarities(
        sentences,
        {
            numSimilaritySentencesLookahead: numSimilaritySentencesLookahead,
            logging: logging,
        }
    );

    // Dynamically adjust the similarity threshold based on variance and average
    let dynamicThreshold = similarityThreshold;
    if (average != null && variance != null) {
        dynamicThreshold = adjustThreshold(average, variance, similarityThreshold, dynamicThresholdLowerBound, dynamicThresholdUpperBound);
    }

    // Create the initial chunks using the adjusted threshold
    const initialChunks = createChunks(sentences, similarities, maxTokenSize, dynamicThreshold, logging);

    if (logging) {
        console.log('\n=============\ninitialChunks\n=============');
        initialChunks.forEach((chunk, index) => {
            console.log("\n");
            console.log(`--------------`);
            console.log(`-- Chunk ${(index + 1)} --`);
            console.log(`--------------`);
            console.log(chunk);
        });
    }

    // Combine similar chunks and balance sizes if requested
    if (combineChunks) {
        const combinedChunks = await optimizeAndRebalanceChunks(initialChunks, tokenizer, maxTokenSize, combineChunksSimilarityThreshold);
        if (logging) {
            console.log('\n\n=============\ncombinedChunks\n=============');
            combinedChunks.forEach((chunk, index) => {
                console.log("\n\n\n");
                console.log("--------------------");
                console.log("Chunk " + (index + 1));
                console.log("--------------------");
                console.log(chunk);
            });
        }
        return combinedChunks;
    } else {
        return initialChunks;
    }
}

// --------------------------
// -- Main cramit function --
// --------------------------
export async function cramit(
    text,
    {
        logging = DEFAULT_CONFIG.LOGGING,
        maxTokenSize = DEFAULT_CONFIG.MAX_TOKEN_SIZE,
        onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
        onnxEmbeddingModelQuantized = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL_QUANTIZED,
        localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
        modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
    } = {}) {

    // Set env variables if provided
    if (localModelPath) env.localModelPath = localModelPath;
    if (modelCacheDir) env.cacheDir = modelCacheDir;

    // Initialize embedding utilities
    await initializeEmbeddingUtils(onnxEmbeddingModel, onnxEmbeddingModelQuantized);
    
    // Split the text into sentences
    const sentences = sentencize(text);
    
    // Create chunks without considering similarities
    const chunks = createChunks(sentences, null, maxTokenSize, 0, logging);
    
    if (logging) {
        console.log('\nCRAMIT');
        console.log('=============\nChunks\n=============');
        chunks.forEach((chunk, index) => {
            console.log("\n");
            console.log(`--------------`);
            console.log(`-- Chunk ${(index + 1)} --`);
            console.log(`--------------`);
            console.log(chunk);
        });
    }

    return chunks;
}
