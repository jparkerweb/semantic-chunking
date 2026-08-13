[< Back to AGENTS.md](../AGENTS.md)

# Architecture

## Core Library (`chunkit.js`, `chunker.js`)

v3 is instance-based. `createChunker(config)` (chunker.js) binds the model
configuration once (model, dtype, device, paths, `embedCallback`, `cache`
mode) and returns per-call `chunkit`/`cramit`/`sentenceit` methods plus
`warmup(texts?)` and `dispose()`. It holds no module-global state, so
concurrent calls and multiple chunkers with different configs are safe.

The classic exports remain and are thin shims over `createChunker`:

| Function | Purpose | Key Differentiator |
|----------|---------|-------------------|
| `chunkit()` | Semantic chunking | Groups sentences by cosine similarity |
| `cramit()` | Dense packing | Fills chunks to max token size, ignores similarity |
| `sentenceit()` | Sentence splitting | Returns individual sentences |

All support `embedCallback` for custom embedding providers (OpenAI, Cohere, etc.). When provided, no ONNX provider is created (the tokenizer still loads for token counting), and `modelName`/`dtypeLabel` config can declare the reported identity. `disposeLocalPipelines`/`disposeLocalTokenizers` are re-exported from embedding-utils for shutdown.

Cache modes (`cache` config, default `'request'`): `'request'` dedups embeddings within one call and retains nothing after; `'instance'` persists a byte-bounded LRU (500 entries / 50 MB / 1h TTL) across calls on one chunker; `false` disables caching. chunkit's final chunk-embedding pass is batched (one model run for all chunks).

## Processing Pipeline

1. **Sentence Splitting** - `sentence-parse` library
2. **Embedding Generation** - local ONNX models via `embedding-utils` `createLocalProvider`, or custom provider via `embedCallback`
3. **Similarity Calculation** - Cosine similarity (`embedding-utils` `cosineSimilarity`) between sentence vectors (batched)
4. **Chunk Formation** - Based on similarity threshold + max token size
5. **Chunk Rebalancing** - Multi-pass merge optimization using linked list and global similarity ranking

## embedding-utils Delegation

The embedding/tokenizer/similarity layer delegates to `embedding-utils` (eu, >= 0.6.0) primitives rather than calling `@huggingface/transformers` directly:

- **Embedding** - `embedding-context.js` builds an eu provider via `createLocalProvider(...)` (with eu's own per-input cache disabled — this package owns caching policy) and calls `provider.embed(texts)`. eu's process-level registries share one native ONNX session and one loaded tokenizer per unique model config, so context/chunker construction is cheap and there is no per-call model re-initialization.
- **Tokenization / token counting** - `embedding-context.js` loads an eu tokenizer via `createTokenizer(...)`; `countTokens` is injected into `createChunks` (chunkingUtils.js) as a parameter.
- **Similarity** - `similarityUtils.js` imports `cosineSimilarity` from eu and re-exports it (no hand-rolled implementation remains).

The custom-provider `embedCallback` path validates results via `validateEmbeddingResult` and participates in the same cache-mode scoping. `returnEmbedding` continues to emit typed-array embeddings.

## Module Responsibilities

| File | Purpose |
|------|---------|
| `config.js` | Default configuration values (including merge optimization params) |
| `chunker.js` | `createChunker` instance factory: binds config, applies per-call defaults, exposes warmup/dispose |
| `embedding-context.js` | Instance-based embedding/tokenizer context: eu provider/tokenizer, cache modes ('request'/'instance'/false), embedCallback validation, warmup |
| `pipeline.js` | The three document-processing pipelines (extracted from 2.x bodies), parameterized by a context; chunkit's final embedding pass is batched |
| `chunkit.js` | Legacy `chunkit`/`cramit`/`sentenceit` shims over `createChunker`, `printVersion`, re-exports |
| `embeddingUtils.js` | **Deprecated** (kept for pre-v3 deep importers): module-global provider/tokenizer wrappers and byte-bounded LRU cache |
| `similarityUtils.js` | Re-exports `cosineSimilarity` from `embedding-utils`, batch similarity computation returning embeddings, dynamic threshold adjustment |
| `chunkingUtils.js` | Chunk creation (`countTokens` injected; legacy fallback), multi-pass merge optimization using linked list data structure |

## Configuration Parameters

Core options:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxTokenSize` | 500 | Maximum tokens per chunk |
| `similarityThreshold` | 0.5 | Minimum similarity to group sentences |
| `combineChunks` | true | Enable chunk rebalancing/merging |
| `embedCallback` | null | Custom embedding function `(texts: string[]) => Promise<number[][]>` |

Merge optimization options (used when `combineChunks: true`):

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxMergesPerPass` | 500 | Absolute limit on merges per optimization pass |
| `maxUncappedPasses` | 100 | Maximum merge iterations before stopping |
| `maxMergesPerPassPercentage` | 40 | Percentage of candidates to merge per pass |
| `uncappedCandidateMerges` | 12 | Below this count, all candidates merge (soft minimum) |

## API Server (`api-server.js`)

Express server exposing chunking functions via REST:
- `POST /api/chunkit` - Semantic chunking
- `POST /api/cramit` - Dense packing
- `POST /api/sentenceit` - Sentence splitting
- `GET /api/health` - Health check
- `GET /api/version` - Version info

Optional Bearer token auth via `API_AUTH_TOKEN` env var.

## Web UI (`webui/`)

Standalone Express app for experimenting with chunking parameters. Communicates with parent library via direct import.
