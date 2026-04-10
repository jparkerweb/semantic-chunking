[< Back to AGENTS.md](../AGENTS.md)

# Development Commands

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
