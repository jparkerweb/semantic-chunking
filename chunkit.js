// ===========================
// == 🍱 semantic-chunking ==
// ==================================================================
// == Semantically create chunks from large texts                  ==
// == Useful for workflows involving large language models (LLMs)  ==
// ==================================================================
// == npm package: https://www.npmjs.com/package/semantic-chunking ==
// == github repo: https://github.com/jparkerweb/semantic-chunking ==
// ==================================================================
//
// v3: `chunkit` / `cramit` / `sentenceit` are thin shims over the instance
// API (`createChunker`, see chunker.js). Creating a chunker per call is cheap
// because embedding-utils >= 0.6.0 shares the native ONNX session and
// tokenizer process-wide — the multi-second per-call model re-initialization
// of 2.x is gone. Long-lived processes should still prefer `createChunker`
// directly: it binds config once, supports cache modes, warmup, and holds no
// per-call construction at all.

import { readFileSync } from 'fs';
import { DEFAULT_CONFIG } from './config.js';
import { createChunker } from './chunker.js';

// Process-wide native resource cleanup (shared sessions/tokenizers live in
// embedding-utils' registries; call these on shutdown or between tests).
export { disposeLocalPipelines, disposeLocalTokenizers } from 'embedding-utils';
export { createChunker };

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const VERSION = packageJson.version;

export async function printVersion() {
    const versionText = `-- semantic-chunking v${VERSION} --`;
    const lineLength = versionText.length;
    console.log(`\n${'-'.repeat(lineLength)}\n${versionText}\n${'-'.repeat(lineLength)}`);
}

/**
 * Splits a 2.x-style flat option bag into chunker construction config and
 * per-call options.
 * @param {Object} options - Legacy combined options.
 * @returns {{ config: Object, callOptions: Object }} Split options.
 */
function splitLegacyOptions(options) {
    const {
        onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
        dtype = DEFAULT_CONFIG.DTYPE,
        device = DEFAULT_CONFIG.DEVICE,
        localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
        modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
        embedCallback = null,
        modelName = null,
        dtypeLabel = null,
        cache = 'request',
        ...callOptions
    } = options;

    return {
        config: {
            onnxEmbeddingModel,
            dtype,
            device,
            localModelPath,
            modelCacheDir,
            embedCallback,
            modelName,
            dtypeLabel,
            cache,
        },
        callOptions,
    };
}

// ---------------------------
// -- Main chunkit function --
// ---------------------------
/**
 * @param {Array} documents - Array of document objects with document_text property
 * @param {Object} options - Configuration options
 * @param {function(string[]): Promise<number[][]>} [options.embedCallback=null] - Optional callback for custom embeddings.
 *   Receives array of texts, must return array of embedding vectors. When provided, ONNX model initialization is skipped.
 * @param {number} [options.maxMergesPerPass=500] - Maximum number of chunk merges allowed per pass in multi-pass merge algorithm.
 * @param {number} [options.maxUncappedPasses=100] - Maximum number of uncapped merge passes before throttling kicks in.
 * @param {number} [options.maxMergesPerPassPercentage=40] - Percentage of total chunks that can be merged per pass (0-100).
 * @param {number} [options.uncappedCandidateMerges=12] - Number of top candidate merges to consider when uncapped.
 * @param {boolean} [options.excludeNonLetterSentences=false] - When true, sentences containing no letters are excluded during parsing.
 * @param {'request'|'instance'|false} [options.cache='request'] - Embedding cache mode (see createChunker).
 */
export async function chunkit(documents, options = {}) {
    if (options.logging) { printVersion(); }
    const { config, callOptions } = splitLegacyOptions(options);
    return createChunker(config).chunkit(documents, callOptions);
}

// --------------------------
// -- Main cramit function --
// --------------------------
/**
 * @param {Array} documents - Array of document objects with document_text property
 * @param {Object} options - Configuration options
 * @param {function(string[]): Promise<number[][]>} [options.embedCallback=null] - Optional callback for custom embeddings.
 *   Receives array of texts, must return array of embedding vectors. When provided, ONNX model initialization is skipped.
 * @param {boolean} [options.excludeNonLetterSentences=false] - When true, sentences containing no letters are excluded during parsing.
 * @param {'request'|'instance'|false} [options.cache='request'] - Embedding cache mode (see createChunker).
 */
export async function cramit(documents, options = {}) {
    if (options.logging) { printVersion(); }
    const { config, callOptions } = splitLegacyOptions(options);
    return createChunker(config).cramit(documents, callOptions);
}

// ------------------------------
// -- Main sentenceit function --
// ------------------------------
/**
 * @param {Array} documents - Array of document objects with document_text property
 * @param {Object} options - Configuration options
 * @param {function(string[]): Promise<number[][]>} [options.embedCallback=null] - Optional callback for custom embeddings.
 *   Receives array of texts, must return array of embedding vectors. When provided, ONNX model initialization is skipped.
 * @param {boolean} [options.excludeNonLetterSentences=false] - When true, sentences containing no letters are excluded during parsing.
 * @param {'request'|'instance'|false} [options.cache='request'] - Embedding cache mode (see createChunker).
 */
export async function sentenceit(documents, options = {}) {
    if (options.logging) { printVersion(); }
    const { config, callOptions } = splitLegacyOptions(options);
    return createChunker(config).sentenceit(documents, callOptions);
}
