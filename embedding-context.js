// ==========================================
// == 🍱 semantic-chunking / embedding-context ==
// ==========================================================================
// Instance-based embedding + tokenizer context backing `createChunker`.
//
// Replaces the module-global `provider` / `tk` singletons in embeddingUtils.js
// (which made concurrent calls with different configs race, and re-created the
// ONNX pipeline + tokenizer on every call). The heavy native resources are
// deduplicated by embedding-utils >= 0.6.0's process-level registries, so
// constructing a context is cheap; this module owns identity, caching policy,
// and the embed/count seams.
//
// Cache modes (`cache` option):
//   'request'  (default) - each top-level chunkit/cramit/sentenceit call gets
//                          a fresh dedup cache, dropped when the call ends.
//                          No text is retained after the call. Matches 2.x
//                          within-call dedup behavior without 2.x's
//                          cross-call retention.
//   'instance'           - a byte-bounded LRU (500 entries / 50 MB / 1 h TTL,
//                          same shape as 2.x's embeddingCache) persists for
//                          the lifetime of the chunker. Opt-in: keys are raw
//                          input text, so this retains content in memory.
//   false                - no caching. Every embedBatch call runs the model.
// ==========================================================================

import { createLocalProvider, createTokenizer } from 'embedding-utils';
import { LRUCache } from 'lru-cache';
import { validateEmbeddingResult } from './embeddingUtils.js';

const CACHE_MODES = new Set(['request', 'instance', false]);

/**
 * Creates an embedding/tokenizer context for a fixed model configuration.
 * @param {Object} config
 * @param {string} config.model - ONNX embedding model id.
 * @param {string} [config.dtype='fp32'] - Model precision (fp32/fp16/q8/q4).
 * @param {string} [config.device='cpu'] - Execution provider.
 * @param {string|null} [config.modelPath=null] - Local model directory.
 * @param {string|null} [config.cacheDir=null] - Model download cache directory.
 * @param {function(string[]): Promise<number[][]>} [config.embedCallback=null] -
 *   Custom embedding callback; when provided no ONNX provider is created.
 * @param {string|null} [config.modelName=null] - Reported model identity
 *   override (mainly for embedCallback users embedding with a known model).
 * @param {string|null} [config.dtypeLabel=null] - Reported dtype override.
 * @param {'request'|'instance'|false} [config.cache='request'] - Cache mode.
 * @returns {Object} The context (see returned object below).
 */
export function createEmbeddingContext({
    model,
    dtype = 'fp32',
    device = 'cpu',
    modelPath = null,
    cacheDir = null,
    embedCallback = null,
    modelName = null,
    dtypeLabel = null,
    cache = 'request',
} = {}) {
    if (!CACHE_MODES.has(cache)) {
        throw new Error(`Invalid cache mode "${cache}". Expected 'request', 'instance', or false.`);
    }

    // Reported identity: real model/dtype for the ONNX path; for the callback
    // path the library genuinely doesn't know what produced the vectors, so it
    // defaults to the legacy 'custom-embedding'/'custom' labels unless the
    // caller declares them via modelName/dtypeLabel.
    const reportedModelName = embedCallback ? (modelName ?? 'custom-embedding') : model;
    const reportedDtype = embedCallback ? (dtypeLabel ?? 'custom') : dtype;

    // The provider's own per-input LRU is disabled (maxSize: 0): this module
    // owns the caching policy, and a second text-keyed cache inside the
    // provider would both waste memory and retain content behind the
    // 'request' mode's no-retention guarantee.
    const provider = embedCallback
        ? null
        : createLocalProvider({
              model,
              precision: dtype,
              device,
              modelPath,
              cacheDir,
              pooling: 'mean',
              cache: { maxSize: 0 },
          });

    const tokenizer = createTokenizer(model, {
        modelPath,
        cacheDir,
    });

    const instanceCache =
        cache === 'instance'
            ? new LRUCache({
                  max: 500,
                  maxSize: 50_000_000,
                  sizeCalculation: (value, key) => value.length * 4 + key.length,
                  ttl: 1000 * 60 * 60,
              })
            : null;

    /**
     * Embeds texts with no cache involvement.
     * @param {string[]} texts - Texts to embed.
     * @returns {Promise<Array<number[]|Float32Array>>} One vector per text.
     */
    async function embedDirect(texts) {
        if (embedCallback) {
            const embeddings = await embedCallback(texts);
            validateEmbeddingResult(texts, embeddings);
            return embeddings;
        }
        const { embeddings } = await provider.embed(texts);
        return embeddings;
    }

    return {
        modelName: reportedModelName,
        dtype: reportedDtype,
        device: embedCallback ? null : device,
        usesCallback: Boolean(embedCallback),

        /** Loads the tokenizer (idempotent; shared via embedding-utils' registry). */
        async load() {
            await tokenizer.load();
        },

        /** @param {string} text @returns {number} Exact token count. */
        countTokens(text) {
            return tokenizer.count(text);
        },

        /** @param {string[]} texts @returns {number[]} Exact token counts. */
        countTokensBatch(texts) {
            return tokenizer.countBatch(texts);
        },

        /**
         * Creates the embed scope for one top-level call. In 'request' mode
         * the scope owns a fresh dedup Map dropped with the scope; in
         * 'instance' mode it shares the context's LRU; with `false` there is
         * no cache.
         * @returns {{ embedBatch: function(string[]): Promise<Array<number[]|Float32Array>> }}
         */
        createScope() {
            const scopeCache = cache === 'request' ? new Map() : instanceCache;

            async function embedBatch(texts) {
                if (!scopeCache) {
                    return embedDirect(texts);
                }

                const results = new Array(texts.length);
                const missTexts = [];
                const missIndices = [];

                for (let i = 0; i < texts.length; i++) {
                    const cached = scopeCache.get(texts[i]);
                    if (cached) {
                        results[i] = cached;
                    } else {
                        missTexts.push(texts[i]);
                        missIndices.push(i);
                    }
                }

                if (missTexts.length > 0) {
                    const embeddings = await embedDirect(missTexts);
                    for (let j = 0; j < missTexts.length; j++) {
                        scopeCache.set(missTexts[j], embeddings[j]);
                        results[missIndices[j]] = embeddings[j];
                    }
                }

                return results;
            }

            return { embedBatch };
        },

        /**
         * Loads the tokenizer and (ONNX path) runs a real embed so the native
         * session is built before the first real call. Pass texts shaped like
         * production traffic — the first inference after session creation runs
         * ~2x slower than steady state, so a realistic batch warms it best.
         * @param {string[]} [texts=['warmup']] - Warmup batch.
         */
        async warmup(texts = ['warmup']) {
            await tokenizer.load();
            if (provider) {
                await provider.embed(texts);
            }
        },

        /**
         * Releases this context's cache. The underlying ONNX session and
         * tokenizer are owned by embedding-utils' shared registries — release
         * those process-wide via its `disposeLocalPipelines()` /
         * `disposeLocalTokenizers()` (re-exported from this package).
         */
        dispose() {
            instanceCache?.clear();
        },
    };
}
