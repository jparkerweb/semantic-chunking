[< Back to AGENTS.md](../AGENTS.md)

# Architecture

## Core Library (`chunkit.js`)

Three exported functions:

| Function | Purpose | Key Differentiator |
|----------|---------|-------------------|
| `chunkit()` | Semantic chunking | Groups sentences by cosine similarity |
| `cramit()` | Dense packing | Fills chunks to max token size, ignores similarity |
| `sentenceit()` | Sentence splitting | Returns individual sentences |

All three functions support `embedCallback` for custom embedding providers (OpenAI, Cohere, etc.). When provided, ONNX models are not initialized.

## Processing Pipeline

1. **Sentence Splitting** - `sentence-parse` library
2. **Embedding Generation** - local ONNX models via `embedding-utils` `createLocalProvider`, or custom provider via `embedCallback`
3. **Similarity Calculation** - Cosine similarity (`embedding-utils` `cosineSimilarity`) between sentence vectors (batched)
4. **Chunk Formation** - Based on similarity threshold + max token size
5. **Chunk Rebalancing** - Multi-pass merge optimization using linked list and global similarity ranking

## embedding-utils Delegation

The internal embedding/tokenizer/similarity layer delegates to `embedding-utils` (eu) primitives rather than calling `@huggingface/transformers` directly:

- **Embedding** - `embeddingUtils.js` builds an eu provider via `createLocalProvider(...)` and calls `provider.embed(texts)`; `@huggingface/transformers` remains the optional peer that eu loads under the hood.
- **Tokenization / token counting** - `embeddingUtils.js` loads an eu tokenizer via `createTokenizer(...)` and exposes internal `countTokens`/`countTokensBatch` helpers used by `chunkit.js` and `chunkingUtils.js`.
- **Similarity** - `similarityUtils.js` imports `cosineSimilarity` from eu and re-exports it (no hand-rolled implementation remains).

Retained behavior (no public API change to `chunkit`/`cramit`/`sentenceit`):

- The byte-bounded (50 MB) per-text `lru-cache` in `embeddingUtils.js` wraps the eu provider, preserving hit-rate/memory behavior (eu's own cache is entry-count-bounded).
- The custom-provider `embedCallback` path is unchanged, including `wrapCallbackWithCache` and `validateEmbeddingResult`.
- `returnEmbedding` continues to emit typed-array embeddings.

## Module Responsibilities

| File | Purpose |
|------|---------|
| `config.js` | Default configuration values (including merge optimization params) |
| `embeddingUtils.js` | Wraps `embedding-utils` provider/tokenizer: model loading, token counting (`countTokens`/`countTokensBatch`), embedding generation/batching with byte-bounded LRU cache, `embedCallback` wrapper |
| `similarityUtils.js` | Re-exports `cosineSimilarity` from `embedding-utils`, batch similarity computation returning embeddings, dynamic threshold adjustment |
| `chunkingUtils.js` | Chunk creation, multi-pass merge optimization using linked list data structure |

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
