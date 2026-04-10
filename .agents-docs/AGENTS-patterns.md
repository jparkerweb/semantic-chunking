[< Back to AGENTS.md](../AGENTS.md)

# Key Patterns

## Document Input Format

All functions accept the same document structure:
```javascript
const documents = [
  { document_name: "optional", document_text: "required text content" }
];
```

## Model Configuration

Models auto-download on first use to `./models`. Supported precisions: `fp32`, `fp16`, `q8`, `q4` (model-dependent).

## Chunk Prefixes for RAG

Use `chunkPrefix` option for models that support task prefixes (e.g., nomic-embed-text-v1.5):
- `"search_document"` for indexing chunks
- `"search_query"` for query embeddings
