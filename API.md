# 🍱 Semantic Chunking API Documentation

Complete API reference for the semantic-chunking microservice.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [POST /api/chunkit](#post-apichunkit)
  - [POST /api/cramit](#post-apicramit)
  - [POST /api/sentenceit](#post-apisentenceit)
  - [GET /api/health](#get-apihealth)
  - [GET /api/version](#get-apiversion)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Docker Deployment](#docker-deployment)
- [Production Setup](#production-setup)

---

## Overview

The Semantic Chunking API provides RESTful endpoints for semantically chunking text using ONNX embedding models. The API is designed to be deployed as a microservice in containerized environments.

**Key Features:**
- Three chunking methods: semantic, dense, and sentence-level
- Optional Bearer token authentication
- CORS enabled for cross-origin requests
- JSON request/response format
- Docker-ready with health checks

---

## Base URL

**Local Development:**
```
http://localhost:3001
```

**Docker (default):**
```
http://localhost:3001
```

**Production:**
Configure your reverse proxy (nginx, Traefik) to forward requests to the container on port 3001.

---

## Authentication

Authentication is **optional** and controlled via the `API_AUTH_TOKEN` environment variable.

### Enabling Authentication

Set the `API_AUTH_TOKEN` environment variable:

```bash
# Local
export API_AUTH_TOKEN=your-secret-token-here

# Docker
docker run -e API_AUTH_TOKEN=your-secret-token-here ...

# Docker Compose
environment:
  - API_AUTH_TOKEN=your-secret-token-here
```

### Using Authentication

When enabled, include the Bearer token in the Authorization header:

```bash
curl -X POST http://localhost:3001/api/chunkit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{"documents": [...]}'
```

### Endpoints Without Auth

The following endpoints are always accessible without authentication:
- `GET /` (landing page)
- `GET /api/health`
- `GET /api/version`

---

## Endpoints

### POST /api/chunkit

Semantically chunk text based on sentence similarity using cosine similarity scores.

**URL:** `/api/chunkit`

**Method:** `POST`

**Auth Required:** Optional (if `API_AUTH_TOKEN` is set)

**Request Body:**

```json
{
  "documents": [
    {
      "document_name": "example",
      "document_text": "Your long text here..."
    }
  ],
  "options": {
    "maxTokenSize": 500,
    "similarityThreshold": 0.5,
    "dynamicThresholdLowerBound": 0.4,
    "dynamicThresholdUpperBound": 0.8,
    "numSimilaritySentencesLookahead": 3,
    "combineChunks": true,
    "combineChunksSimilarityThreshold": 0.5,
    "onnxEmbeddingModel": "Xenova/all-MiniLM-L6-v2",
    "dtype": "q8",
    "device": "cpu",
    "returnEmbedding": false,
    "returnTokenLength": true,
    "chunkPrefix": null,
    "excludeChunkPrefixInResults": false
  }
}
```

**Success Response (200):**

```json
[
  {
    "document_id": 1234567890,
    "document_name": "example",
    "number_of_chunks": 5,
    "chunk_number": 1,
    "model_name": "Xenova/all-MiniLM-L6-v2",
    "dtype": "q8",
    "text": "First chunk of text...",
    "token_length": 245
  },
  ...
]
```

**Example with curl:**

```bash
curl -X POST http://localhost:3001/api/chunkit \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "document_name": "test",
        "document_text": "This is a test document. It has multiple sentences. Each sentence will be analyzed for semantic similarity."
      }
    ],
    "options": {
      "maxTokenSize": 100,
      "similarityThreshold": 0.5
    }
  }'
```

---

### POST /api/cramit

Pack sentences into dense chunks up to the maximum token size without considering semantic similarity.

**URL:** `/api/cramit`

**Method:** `POST`

**Auth Required:** Optional (if `API_AUTH_TOKEN` is set)

**Request Body:**

```json
{
  "documents": [
    {
      "document_name": "example",
      "document_text": "Your text here..."
    }
  ],
  "options": {
    "maxTokenSize": 500,
    "onnxEmbeddingModel": "Xenova/all-MiniLM-L6-v2",
    "dtype": "q8",
    "device": "cpu",
    "returnEmbedding": false,
    "returnTokenLength": true,
    "chunkPrefix": null,
    "excludeChunkPrefixInResults": false
  }
}
```

**Success Response (200):**

Same format as `/api/chunkit`.

**Example with curl:**

```bash
curl -X POST http://localhost:3001/api/cramit \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "document_text": "Quick and dirty chunking. No semantic analysis. Just pack sentences together."
      }
    ],
    "options": {
      "maxTokenSize": 50
    }
  }'
```

---

### POST /api/sentenceit

Split text into individual sentences.

**URL:** `/api/sentenceit`

**Method:** `POST`

**Auth Required:** Optional (if `API_AUTH_TOKEN` is set)

**Request Body:**

```json
{
  "documents": [
    {
      "document_name": "example",
      "document_text": "Your text here..."
    }
  ],
  "options": {
    "onnxEmbeddingModel": "Xenova/all-MiniLM-L6-v2",
    "dtype": "q8",
    "device": "cpu",
    "returnEmbedding": false,
    "returnTokenLength": false,
    "chunkPrefix": null,
    "excludeChunkPrefixInResults": false
  }
}
```

**Success Response (200):**

```json
[
  {
    "document_id": 1234567890,
    "document_name": "example",
    "number_of_sentences": 10,
    "sentence_number": 1,
    "text": "First sentence."
  },
  ...
]
```

**Example with curl:**

```bash
curl -X POST http://localhost:3001/api/sentenceit \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "document_text": "First sentence. Second sentence. Third sentence."
      }
    ],
    "options": {}
  }'
```

---

### GET /api/health

Health check endpoint for monitoring and load balancers.

**URL:** `/api/health`

**Method:** `GET`

**Auth Required:** No

**Success Response (200):**

```json
{
  "status": "ok",
  "version": "2.4.4",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

**Example with curl:**

```bash
curl http://localhost:3001/api/health
```

---

### GET /api/version

Get API version information.

**URL:** `/api/version`

**Method:** `GET`

**Auth Required:** No

**Success Response (200):**

```json
{
  "version": "2.4.4",
  "package": "semantic-chunking"
}
```

**Example with curl:**

```bash
curl http://localhost:3001/api/version
```

---

## Request Format

All POST endpoints expect a JSON body with the following structure:

```json
{
  "documents": [
    {
      "document_name": "optional-name",
      "document_text": "required-text-content"
    }
  ],
  "options": {
    // Optional configuration parameters
  }
}
```

**Required Fields:**
- `documents`: Array of document objects
- `documents[].document_text`: The text content to process

**Optional Fields:**
- `documents[].document_name`: Name/identifier for the document
- `options`: Configuration object (see individual endpoints for available options)

---

## Response Format

### Success Responses

All successful requests return:
- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Body:** Array of chunk/sentence objects

### Chunk Object Structure

```json
{
  "document_id": 1234567890,
  "document_name": "name",
  "number_of_chunks": 5,
  "chunk_number": 1,
  "model_name": "Xenova/all-MiniLM-L6-v2",
  "dtype": "q8",
  "text": "Chunk text...",
  "token_length": 123,        // if returnTokenLength: true
  "embedding": [0.1, 0.2, ...]  // if returnEmbedding: true
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "stack": "Stack trace (only in development mode)"
}
```

### Common Status Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid request body or missing required fields |
| 401 | Unauthorized | Missing or invalid Bearer token (when auth is enabled) |
| 500 | Internal Server Error | Processing error (e.g., model loading failed) |

### Example Error Responses

**400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Request body must include a \"documents\" array"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authorization token"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Error loading model: model not found"
}
```

---

## Docker Deployment

### Quick Start

**API Only (default):**
```bash
docker-compose up -d
```

The API will be available at `http://localhost:3001`

**With Web UI:**
```bash
docker-compose --profile webui up -d
```

- API: `http://localhost:3001`
- Web UI: `http://localhost:3000`

### Docker Run

```bash
# Build the image
docker build -t semantic-chunking .

# Run API server (default)
docker run -d \
  -p 3001:3001 \
  -v ./models:/app/models \
  -e API_AUTH_TOKEN=your-token \
  --name semantic-chunking-api \
  semantic-chunking

# Run Web UI (override command)
docker run -d \
  -p 3000:3000 \
  -v ./models:/app/models \
  --name semantic-chunking-webui \
  semantic-chunking node webui/server.js
```

### Environment Variables

```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=production          # Environment mode
API_AUTH_TOKEN=secret-token  # Optional Bearer token auth
```

### Volume Mounts

Mount the models directory to persist downloaded ONNX models:

```bash
-v ./models:/app/models
```

Models are downloaded automatically on first use and range from 23MB to 548MB depending on the model selected.

---

## Production Setup

### HTTPS / TLS Termination

The API server runs on HTTP only. For production, use a reverse proxy to handle HTTPS:

#### nginx Example

```nginx
upstream semantic_chunking {
    server localhost:3001;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://semantic_chunking;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for large documents
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

#### Traefik Example (docker-compose.yml)

```yaml
services:
  semantic-chunking-api:
    # ... existing config ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.semantic-api.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.semantic-api.entrypoints=websecure"
      - "traefik.http.routers.semantic-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.semantic-api.loadbalancer.server.port=3001"
```

### Security Best Practices

1. **Always use HTTPS in production** (via reverse proxy)
2. **Enable Bearer token authentication** by setting `API_AUTH_TOKEN`
3. **Use strong, randomly generated tokens** (min 32 characters)
4. **Rotate tokens regularly**
5. **Use environment variables or secrets management** (never hardcode tokens)
6. **Monitor logs for unauthorized access attempts**
7. **Keep Docker images updated** (`docker-compose pull && docker-compose up -d`)

### Monitoring

Use the health check endpoint for monitoring:

```bash
# Direct check
curl http://localhost:3001/api/health

# Docker health check (already configured in docker-compose.yml)
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Rate Limiting

Consider adding rate limiting at the reverse proxy level:

**nginx:**
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location / {
    limit_req zone=api_limit burst=20 nodelay;
    # ... proxy settings ...
}
```

**Traefik:**
```yaml
labels:
  - "traefik.http.middlewares.api-ratelimit.ratelimit.average=10"
  - "traefik.http.middlewares.api-ratelimit.ratelimit.burst=20"
  - "traefik.http.routers.semantic-api.middlewares=api-ratelimit"
```

---

## Support

- **GitHub:** [https://github.com/jparkerweb/semantic-chunking](https://github.com/jparkerweb/semantic-chunking)
- **Issues:** [https://github.com/jparkerweb/semantic-chunking/issues](https://github.com/jparkerweb/semantic-chunking/issues)
- **NPM:** [https://www.npmjs.com/package/semantic-chunking](https://www.npmjs.com/package/semantic-chunking)

---

**Maintained by [eQuill Labs](https://www.equilllabs.com)**