# Examples Guide

This directory contains examples demonstrating how to use the semantic-chunking library.

## Basic Examples

### Core Functionality
- **`example-chunkit.js`** - Semantic chunking (groups by similarity)
- **`example-cramit.js`** - Dense packing (max tokens, ignores similarity)
- **`example-sentenceit.js`** - Sentence splitting (individual sentences)
- **`example-api.js`** - Using the REST API client

Run with:
```bash
npm run example-chunkit
npm run example-cramit
npm run example-sentenceit
npm run example-api
```

---

## Custom Embedding Provider Examples (v2.6.0+)

All examples below demonstrate the new `embedCallback` parameter for using custom embedding providers instead of the built-in ONNX models.

### 🆓 Free Options (Recommended for Testing)

#### 1. Hugging Face Inference API ⭐ **Best for beginners**
**File:** `example-embedCallback-huggingface.js`

```bash
# Get free API key: https://huggingface.co/settings/tokens
export HF_API_KEY=your_token_here
npm run example-embedCallback-huggingface
```

**Pros:**
- Completely free (no credit card)
- Easy to set up
- Many models available

---

#### 2. Local Ollama ⭐ **Best for privacy**
**File:** `example-embedCallback-ollama.js`

```bash
# Install Ollama: https://ollama.ai
curl https://ollama.ai/install.sh | sh

# Pull embedding model
ollama pull nomic-embed-text

# Run example (no API key needed!)
npm run example-embedCallback-ollama
```

**Pros:**
- 100% free and private
- No API keys
- Works offline
- No rate limits

---

#### 3. Mock Embeddings ⭐ **Best for testing**
**File:** `example-embedCallback-mock.js`

```bash
# No setup required!
npm run example-embedCallback-mock
```

**Pros:**
- Zero dependencies
- No API keys
- Perfect for CI/CD
- Tests functionality without external APIs

**Note:** Mock embeddings are deterministic but not semantically meaningful.

---

### 💳 Paid Options (Requires API Key)

#### 4. OpenAI
**File:** `example-embedCallback.js`

```bash
# Requires OpenAI API key (paid)
export OPENAI_API_KEY=your_key_here
npm run example-embedCallback
```

**Pros:**
- High-quality embeddings
- Fast API
- Reliable service

**Cons:**
- Requires payment
- API costs per request

---

## Testing New Features

### Comprehensive Test Suite
**File:** `test-new-features.js`

Tests all new v2.6.0 features:
- ✅ embedCallback with chunkit, cramit, sentenceit
- ✅ Merge optimization parameters
- ✅ Error handling and validation
- ✅ Callback caching
- ✅ Backward compatibility
- ✅ Edge cases

```bash
npm run test-new-features
```

**Output:**
```
🧪 TESTING NEW FEATURES (v2.6.0)

======================================================================
TEST: embedCallback with chunkit()
======================================================================
✓ Created chunks successfully
✓ Model name is "custom-embedding"
...

🎉 All tests passed! New features are working correctly.
```

---

## Quick Start Decision Tree

**Want to test embedCallback without any setup?**
→ Use `example-embedCallback-mock.js`

**Want free embeddings with good quality?**
→ Use `example-embedCallback-huggingface.js` (requires free API key)

**Want completely private/offline embeddings?**
→ Use `example-embedCallback-ollama.js` (requires local install)

**Want production-grade embeddings and have budget?**
→ Use `example-embedCallback.js` (OpenAI, requires paid API key)

**Want to test all new features at once?**
→ Run `test-new-features.js`

---

## Feature Matrix

| Example | Free | No API Key | Offline | Quality | Speed |
|---------|------|------------|---------|---------|-------|
| Mock | ✅ | ✅ | ✅ | ⚠️ Testing only | ⚡⚡⚡ |
| Ollama | ✅ | ✅ | ✅ | ⭐⭐⭐ | ⚡⚡ |
| Hugging Face | ✅ | ❌ | ❌ | ⭐⭐⭐⭐ | ⚡⚡ |
| OpenAI | ❌ | ❌ | ❌ | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ |

---

## Environment Variables

Create a `.env` file in the project root (optional):

```bash
# OpenAI (paid)
OPENAI_API_KEY=sk-...

# Hugging Face (free)
HF_API_KEY=hf_...

# Ollama (local, optional)
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Need Help?

- **Documentation:** See main [README.md](../README.md)
- **API Reference:** See [API.md](../API.md)
- **Issues:** https://github.com/jparkerweb/semantic-chunking/issues
