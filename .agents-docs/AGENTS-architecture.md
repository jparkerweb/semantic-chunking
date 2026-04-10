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
2. **Embedding Generation** - `@huggingface/transformers` ONNX models, or custom provider via `embedCallback`
3. **Similarity Calculation** - Cosine similarity between sentence vectors (batched)
4. **Chunk Formation** - Based on similarity threshold + max token size
5. **Chunk Rebalancing** - Multi-pass merge optimization using linked list and global similarity ranking

## Module Responsibilities

| File | Purpose |
|------|---------|
| `config.js` | Default configuration values (including merge optimization params) |
| `embeddingUtils.js` | Model loading, tokenization, embedding generation/batching with LRU cache, callback wrapper |
| `similarityUtils.js` | Cosine similarity, batch similarity computation returning embeddings, dynamic threshold adjustment |
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
