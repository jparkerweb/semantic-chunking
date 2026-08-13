// ===================================
// == 🍱 semantic-chunking / chunker ==
// ==========================================================================
// Instance API: `createChunker(config)` binds the model configuration once
// and returns chunkit/cramit/sentenceit methods that take only per-call
// chunking options. Long-lived processes (servers) should create one chunker
// per model config and reuse it — the underlying ONNX session and tokenizer
// are shared process-wide by embedding-utils >= 0.6.0, and the chunker holds
// no module-global state, so concurrent calls (and multiple chunkers with
// different configs) are safe.
//
//   const chunker = createChunker({ onnxEmbeddingModel: '...', dtype: 'fp32' });
//   await chunker.warmup();                  // optional: pre-build the session
//   const chunks = await chunker.chunkit(documents, { maxTokenSize: 128 });
// ==========================================================================

import { DEFAULT_CONFIG } from './config.js';
import { createEmbeddingContext } from './embedding-context.js';
import { runChunkit, runCramit, runSentenceit } from './pipeline.js';

/**
 * Applies the per-call option defaults shared by the three pipelines.
 * @param {Object} options - Caller options.
 * @returns {Object} Options with defaults applied.
 */
function withCallDefaults(options) {
    return {
        logging: options.logging ?? DEFAULT_CONFIG.LOGGING,
        maxTokenSize: options.maxTokenSize ?? DEFAULT_CONFIG.MAX_TOKEN_SIZE,
        similarityThreshold: options.similarityThreshold ?? DEFAULT_CONFIG.SIMILARITY_THRESHOLD,
        dynamicThresholdLowerBound: options.dynamicThresholdLowerBound ?? DEFAULT_CONFIG.DYNAMIC_THRESHOLD_LOWER_BOUND,
        dynamicThresholdUpperBound: options.dynamicThresholdUpperBound ?? DEFAULT_CONFIG.DYNAMIC_THRESHOLD_UPPER_BOUND,
        numSimilaritySentencesLookahead: options.numSimilaritySentencesLookahead ?? DEFAULT_CONFIG.NUM_SIMILARITY_SENTENCES_LOOKAHEAD,
        combineChunks: options.combineChunks ?? DEFAULT_CONFIG.COMBINE_CHUNKS,
        combineChunksSimilarityThreshold: options.combineChunksSimilarityThreshold ?? DEFAULT_CONFIG.COMBINE_CHUNKS_SIMILARITY_THRESHOLD,
        returnEmbedding: options.returnEmbedding ?? DEFAULT_CONFIG.RETURN_EMBEDDING,
        returnTokenLength: options.returnTokenLength ?? DEFAULT_CONFIG.RETURN_TOKEN_LENGTH,
        chunkPrefix: options.chunkPrefix ?? DEFAULT_CONFIG.CHUNK_PREFIX,
        excludeChunkPrefixInResults: options.excludeChunkPrefixInResults ?? false,
        excludeNonLetterSentences: options.excludeNonLetterSentences ?? DEFAULT_CONFIG.EXCLUDE_NON_LETTER_SENTENCES,
        maxMergesPerPass: options.maxMergesPerPass ?? DEFAULT_CONFIG.MAX_MERGES_PER_PASS,
        maxUncappedPasses: options.maxUncappedPasses ?? DEFAULT_CONFIG.MAX_UNCAPPED_PASSES,
        maxMergesPerPassPercentage: options.maxMergesPerPassPercentage ?? DEFAULT_CONFIG.MAX_MERGES_PER_PASS_PERCENTAGE,
        uncappedCandidateMerges: options.uncappedCandidateMerges ?? DEFAULT_CONFIG.UNCAPPED_CANDIDATE_MERGES,
    };
}

/**
 * Creates a chunker instance bound to one model configuration.
 *
 * @param {Object} [config={}] - Model/session configuration (fixed for the
 *   instance's lifetime; per-call chunking knobs go on the method calls).
 * @param {string} [config.onnxEmbeddingModel] - ONNX embedding model id.
 * @param {string} [config.dtype] - Model precision (fp32/fp16/q8/q4).
 * @param {string} [config.device] - Execution provider (e.g. 'cpu', 'cuda', 'dml').
 * @param {string} [config.localModelPath] - Local model directory.
 * @param {string} [config.modelCacheDir] - Model download cache directory.
 * @param {function(string[]): Promise<number[][]>} [config.embedCallback] -
 *   Custom embedding callback. When provided, no ONNX provider is created
 *   (the tokenizer is still loaded for token counting).
 * @param {string} [config.modelName] - Reported model identity override for
 *   the embedCallback path (defaults to 'custom-embedding').
 * @param {string} [config.dtypeLabel] - Reported dtype override for the
 *   embedCallback path (defaults to 'custom').
 * @param {'request'|'instance'|false} [config.cache='request'] - Embedding
 *   cache mode. 'request' dedups within one call and retains nothing after;
 *   'instance' persists a byte-bounded LRU across calls (retains raw text
 *   keys in memory); false disables caching.
 * @returns {Object} Chunker with chunkit/cramit/sentenceit/warmup/dispose.
 */
export function createChunker({
    onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
    dtype = DEFAULT_CONFIG.DTYPE,
    device = DEFAULT_CONFIG.DEVICE,
    localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
    modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
    embedCallback = null,
    modelName = null,
    dtypeLabel = null,
    cache = 'request',
} = {}) {
    const ctx = createEmbeddingContext({
        model: onnxEmbeddingModel,
        dtype,
        device,
        modelPath: localModelPath,
        cacheDir: modelCacheDir,
        embedCallback,
        modelName,
        dtypeLabel,
        cache,
    });

    return {
        /** Reported model identity (real model id, or the embedCallback label). */
        modelName: ctx.modelName,
        /** Reported dtype (real dtype, or the embedCallback label). */
        dtype: ctx.dtype,
        /** Execution provider for the ONNX path (null when using embedCallback). */
        device: ctx.device,

        /**
         * Semantic chunking (split -> similarity -> merge).
         * @param {Array} documents - Document objects with document_text.
         * @param {Object} [options={}] - Per-call chunking options.
         * @returns {Promise<Array>} Chunk results.
         */
        async chunkit(documents, options = {}) {
            await ctx.load();
            return runChunkit(ctx, documents, withCallDefaults(options));
        },

        /**
         * Greedy token-packed chunking (no similarity).
         * @param {Array} documents - Document objects with document_text.
         * @param {Object} [options={}] - Per-call options.
         * @returns {Promise<Array>} Chunk results.
         */
        async cramit(documents, options = {}) {
            await ctx.load();
            return runCramit(ctx, documents, withCallDefaults(options));
        },

        /**
         * Sentence splitting (optionally with embeddings).
         * @param {Array} documents - Document objects with document_text.
         * @param {Object} [options={}] - Per-call options.
         * @returns {Promise<Array>} Sentence results.
         */
        async sentenceit(documents, options = {}) {
            await ctx.load();
            return runSentenceit(ctx, documents, withCallDefaults(options));
        },

        /**
         * Pre-loads the tokenizer and (ONNX path) runs a real embed so the
         * native session is built before the first real call. Pass texts
         * shaped like production traffic for best effect — the first
         * inference after session creation runs ~2x slower than steady state.
         * @param {string[]} [texts] - Warmup batch (default ['warmup']).
         */
        async warmup(texts) {
            await ctx.warmup(texts);
        },

        /**
         * Releases this chunker's embedding cache. The shared ONNX session /
         * tokenizer live in embedding-utils' process-level registries —
         * release those with `disposeLocalPipelines()` /
         * `disposeLocalTokenizers()` (re-exported from this package).
         */
        dispose() {
            ctx.dispose();
        },
    };
}
