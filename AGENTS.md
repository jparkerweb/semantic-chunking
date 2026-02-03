# AGENTS.md

This file provides guidance to AI coding agents like Claude Code (claude.ai/code), Cursor AI, Codex, Gemini CLI, GitHub Copilot, and other AI coding assistants when working with code in this repository.

## Project Overview

semantic-chunking is an NPM package that semantically creates chunks from large texts using ONNX embedding models. It's designed for workflows involving LLMs and RAG applications.

## Development Commands

```bash
# Install dependencies (main + webui)
npm run setup

# Run examples
npm run example-chunkit      # Semantic chunking
npm run example-cramit       # Dense packing
npm run example-sentenceit   # Sentence splitting
npm run example-api          # API client example

# Start servers
npm run api-server           # API server on port 3001
cd webui && npm start        # Web UI on port 3000

# Docker
npm run docker:compose:up    # Start API server
npm run docker:compose:all   # Start API + Web UI

# Pre-download embedding models
npm run download-models      # Uses tools/download-models.list.json
```

## Architecture

### Core Library (`chunkit.js`)

Three exported functions:

| Function | Purpose | Key Differentiator |
|----------|---------|-------------------|
| `chunkit()` | Semantic chunking | Groups sentences by cosine similarity |
| `cramit()` | Dense packing | Fills chunks to max token size, ignores similarity |
| `sentenceit()` | Sentence splitting | Returns individual sentences |

### Processing Pipeline

1. **Sentence Splitting** - `sentence-parse` library
2. **Embedding Generation** - `@huggingface/transformers` ONNX models
3. **Similarity Calculation** - Cosine similarity between sentence vectors
4. **Chunk Formation** - Based on similarity threshold + max token size
5. **Chunk Rebalancing** - Optional combining of similar adjacent chunks

### Module Responsibilities

| File | Purpose |
|------|---------|
| `config.js` | Default configuration values |
| `embeddingUtils.js` | Model loading, tokenization, embedding generation with LRU cache |
| `similarityUtils.js` | Cosine similarity, advanced similarity computation, dynamic threshold adjustment |
| `chunkingUtils.js` | Chunk creation and optimization logic |

### API Server (`api-server.js`)

Express server exposing chunking functions via REST:
- `POST /api/chunkit` - Semantic chunking
- `POST /api/cramit` - Dense packing
- `POST /api/sentenceit` - Sentence splitting
- `GET /api/health` - Health check
- `GET /api/version` - Version info

Optional Bearer token auth via `API_AUTH_TOKEN` env var.

### Web UI (`webui/`)

Standalone Express app for experimenting with chunking parameters. Communicates with parent library via direct import.

## Key Patterns

### Document Input Format

All functions accept the same document structure:
```javascript
const documents = [
  { document_name: "optional", document_text: "required text content" }
];
```

### Model Configuration

Models auto-download on first use to `./models`. Supported precisions: `fp32`, `fp16`, `q8`, `q4` (model-dependent).

### Chunk Prefixes for RAG

Use `chunkPrefix` option for models that support task prefixes (e.g., nomic-embed-text-v1.5):
- `"search_document"` for indexing chunks
- `"search_query"` for query embeddings

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | API server port | 3001 |
| `API_AUTH_TOKEN` | Bearer token for API auth | none (disabled) |
| `NODE_ENV` | Environment mode | development |
