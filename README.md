# 🍱 semantic-chunking

NPM Package for Semantically creating chunks from large texts. Useful for workflows involving large language models (LLMs).

### Maintained by
<a href="https://www.equilllabs.com">
  <img src="https://raw.githubusercontent.com/jparkerweb/eQuill-Labs/refs/heads/main/src/static/images/logo-text-outline.png" alt="eQuill Labs" height="32">
</a>

## Features

- Semantic chunking based on sentence similarity
- Dynamic similarity thresholds
- Configurable chunk sizes
- Multiple embedding model options
- Quantized model support
- Chunk prefix support for RAG workflows
- Web UI for experimenting with settings

## Semantic Chunking Workflow
_how it works_

1. **Sentence Splitting**: The input text is split into an array of sentences.
2. **Embedding Generation**: A vector is created for each sentence using the specified ONNX model.
3. **Similarity Calculation**: Cosine similarity scores are calculated for each sentence pair.
4. **Chunk Formation**: Sentences are grouped into chunks based on the similarity threshold and max token size.
5. **Chunk Rebalancing**: Optionally, similar adjacent chunks are combined into larger ones up to the max token size.
6. **Output**: The final chunks are returned as an array of objects, each containing the properties described above.

## Installation

```bash
npm install semantic-chunking
```

## Docker Usage

The easiest way to run semantic-chunking is using Docker Compose:

### Docker Compose (Recommended)

```bash
# Start the Web UI server
npm run docker:compose:up

# Access the Web UI at http://localhost:3000

# Stop the server
npm run docker:compose:down
```

The `docker-compose.yml` configuration includes:
- Port mapping: `3000:3000` for the Web UI
- Volume mapping: `./models` directory is mounted to persist downloaded embedding models between container restarts
- Health checks and auto-restart policies

### Alternative Docker Commands

```bash
# Build the Docker image
npm run docker:build

# Run the container with models volume
npm run docker:run

# Or use docker-compose directly
docker-compose up -d
```

### Using the Library in Docker

To use the chunking functions directly (not just the Web UI):

```bash
# Execute chunkit example inside the container
docker-compose exec semantic-chunking node example/example-chunkit.js

# Execute cramit example
docker-compose exec semantic-chunking node example/example-cramit.js

# Execute sentenceit example
docker-compose exec semantic-chunking node example/example-sentenceit.js
```

### About the Models Volume

The `./models` directory is mounted as a volume to persist downloaded ONNX embedding models. Models are automatically downloaded on first use and can range from 23MB to 548MB depending on which model you choose. Persisting this directory means:
- Models are downloaded only once
- Faster container restarts
- Models survive container updates
- You can pre-download models using `npm run download-models` before running Docker

---

## API Server Usage

Run semantic-chunking as a **microservice API** for integration into your applications.

### Quick Start

**Start the API server:**
```bash
# Using Docker Compose (recommended)
npm run docker:compose:up

# Or run locally
npm run api-server
```

The API will be available at `http://localhost:3001` with a terminal-styled landing page showing usage instructions.

### API Endpoints

- `POST /api/chunkit` - Semantic chunking based on similarity
- `POST /api/cramit` - Dense packing without similarity analysis
- `POST /api/sentenceit` - Split text into sentences
- `GET /api/health` - Health check
- `GET /api/version` - API version

### Example API Request

```bash
curl -X POST http://localhost:3001/api/chunkit \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "document_name": "test",
        "document_text": "Your text here..."
      }
    ],
    "options": {
      "maxTokenSize": 500,
      "similarityThreshold": 0.5
    }
  }'
```

### Authentication (Optional)

Enable Bearer token authentication by setting the `API_AUTH_TOKEN` environment variable:

```bash
# In .env file
API_AUTH_TOKEN=your-secret-token-here

# Or in docker-compose.yml
environment:
  - API_AUTH_TOKEN=your-secret-token-here
```

When enabled, include the token in requests:
```bash
curl -X POST http://localhost:3001/api/chunkit \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '...'
```

### Docker Services

The docker-compose configuration includes two services:

**API Server (default):**
```bash
docker-compose up -d
# Available at http://localhost:3001
```

**API Server + Web UI:**
```bash
docker-compose --profile webui up -d
# API: http://localhost:3001
# Web UI: http://localhost:3000
```

### Complete Documentation

For full API documentation including all endpoints, request/response formats, error handling, and production deployment guides, see [API.md](API.md).

---

## Usage

Basic usage:

```javascript
import { chunkit } from 'semantic-chunking';

const documents = [
    { document_name: "document1", document_text: "contents of document 1..." },
    { document_name: "document2", document_text: "contents of document 2..." },
    ...
];
const chunkitOptions = {};
const myChunks = await chunkit(documents, chunkitOptions);

```

**NOTE** 🚨 The Embedding model (`onnxEmbeddingModel`) will be downloaded to this package's cache directory the first it is run (file size will depend on the specified model; see the model's table ).

## Parameters

`chunkit` accepts an array of document objects and an optional configuration object. Here are the details for each parameter:

- `documents`: array of documents. each document is an object containing `document_name` and `document_text`.
  ```
  documents = [
    { document_name: "document1", document_text: "..." },
    { document_name: "document2", document_text: "..." },
    ...
  ]
  ```

- **Chunkit Options Object:**
  
  - `logging`: Boolean (optional, default `false`) - Enables logging of detailed processing steps.
  - `maxTokenSize`: Integer (optional, default `500`) - Maximum token size for each chunk.
  - `similarityThreshold`: Float (optional, default `0.5`) - Threshold to determine if sentences are similar enough to be in the same chunk. A higher value demands higher similarity.
  - `dynamicThresholdLowerBound`: Float (optional, default `0.4`) - Minimum possible dynamic similarity threshold.
  - `dynamicThresholdUpperBound`: Float (optional, default `0.8`) - Maximum possible dynamic similarity threshold.
  - `numSimilaritySentencesLookahead`: Integer (optional, default `3`) - Number of sentences to look ahead for calculating similarity.
  - `combineChunks`: Boolean (optional, default `true`) - Determines whether to reblance and combine chunks into larger ones up to the max token limit.
  - `combineChunksSimilarityThreshold`: Float (optional, default `0.5`) - Threshold for combining chunks based on similarity during the rebalance and combining phase.
  - `onnxEmbeddingModel`: String (optional, default `Xenova/all-MiniLM-L6-v2`) - ONNX model used for creating embeddings.
  - `dtype`: String (optional, default `fp32`) - Precision of the embedding model (options: `fp32`, `fp16`, `q8`, `q4`).
  - `device`: String (optional, default `cpu`) - The execution provider to use for the model (options: `cpu`, `webgpu`).
  - `localModelPath`: String (optional, default `null`) - Local path to save and load models (example: `./models`).
  - `modelCacheDir`: String (optional, default `null`) - Directory to cache downloaded models (example: `./models`).
  - `returnEmbedding`: Boolean (optional, default `false`) - If set to `true`, each chunk will include an embedding vector. This is useful for applications that require semantic understanding of the chunks. The embedding model will be the same as the one specified in `onnxEmbeddingModel`.
  - `returnTokenLength`: Boolean (optional, default `false`) - If set to `true`, each chunk will include the token length. This can be useful for understanding the size of each chunk in terms of tokens, which is important for token-based processing limits. The token length is calculated using the tokenizer specified in `onnxEmbeddingModel`.
  - `chunkPrefix`: String (optional, default `null`) - A prefix to add to each chunk (e.g., "search_document: "). This is particularly useful when using embedding models that are trained with specific task prefixes, like the nomic-embed-text-v1.5 model. The prefix is added before calculating embeddings or token lengths.
  - `excludeChunkPrefixInResults`: Boolean (optional, default `false`) - If set to `true`, the chunk prefix will be removed from the results. This is useful when you want to remove the prefix from the results while still maintaining the prefix for embedding calculations.

## Output

The output is an array of chunks, each containing the following properties:

- `document_id`: Integer - A unique identifier for the document (current timestamp in milliseconds).
- `document_name`: String - The name of the document being chunked (if provided).
- `number_of_chunks`: Integer - The total number of final chunks returned from the input text.
- `chunk_number`: Integer - The number of the current chunk.
- `model_name`: String - The name of the embedding model used.
- `dtype`: String - The precision of the embedding model used (options: `fp32`, `fp16`, `q8`, `q4`).
- `text`: String - The chunked text.
- `embedding`: Array - The embedding vector (if `returnEmbedding` is `true`).
- `token_length`: Integer - The token length (if `returnTokenLength` is `true`).

## **NOTE** 🚨 Every Embedding Model behaves differently!
It is important to understand how the model you choose behaves when chunking your text.
It is highly recommended to tweak all the parameters using the Web UI to get the best results for your use case.
[Web UI README](webui/README.md)

## Examples

Example 1: Basic usage with custom similarity threshold:

```javascript
import { chunkit } from 'semantic-chunking';
import fs from 'fs';

async function main() {
    const documents = [ 
        {
            document_name: "test document", 
            document_text: await fs.promises.readFile('./test.txt', 'utf8') 
        }
    ];
    let myChunks = await chunkit(documents, { similarityThreshold: 0.4 });

    myChunks.forEach((chunk, index) => {
        console.log(`\n-- Chunk ${index + 1} --`);
        console.log(chunk);
    });
}
main();

```

Example 2: Chunking with a small max token size:

```javascript
import { chunkit } from 'semantic-chunking';

const frogText = "A frog hops into a deli and croaks to the cashier, \"I'll have a sandwich, please.\" The cashier, surprised, quickly makes the sandwich and hands it over. The frog takes a big bite, looks around, and then asks, \"Do you have any flies to go with this?\" The cashier, taken aback, replies, \"Sorry, we're all out of flies today.\" The frog shrugs and continues munching on its sandwich, clearly unfazed by the lack of fly toppings. Just another day in the life of a sandwich-loving amphibian! 🐸🥪";
const documents = [
    {
        document_name: "frog document",
        document_text: frogText
    }
];

async function main() {
    let myFrogChunks = await chunkit(documents, { maxTokenSize: 65 });
    console.log("myFrogChunks", myFrogChunks);
}
main();

```

Look at the `example\example-chunkit.js` file for a more complex example of using all the optional parameters.


## Tuning

The behavior of the `chunkit` function can be finely tuned using several optional parameters in the options object. Understanding how each parameter affects the function can help you optimize the chunking process for your specific requirements.

### `logging`

- **Type**: Boolean
- **Default**: `false`
- **Description**: Enables detailed debug output during the chunking process. Turning this on can help in diagnosing how chunks are formed or why certain chunks are combined.

### `maxTokenSize`

- **Type**: Integer
- **Default**: `500`
- **Description**: Sets the maximum number of tokens allowed in a single chunk. Smaller values result in smaller, more numerous chunks, while larger values can create fewer, larger chunks. It’s crucial for maintaining manageable chunk sizes when processing large texts.

### `similarityThreshold`

- **Type**: Float
- **Default**: `0.456`
- **Description**: Determines the minimum cosine similarity required for two sentences to be included in the same chunk. Higher thresholds demand greater similarity, potentially leading to more but smaller chunks, whereas lower values might result in fewer, larger chunks.

### `dynamicThresholdLowerBound`

- **Type**: Float
- **Default**: `0.2`
- **Description**: The minimum limit for dynamically adjusted similarity thresholds during chunk formation. This ensures that the dynamic threshold does not fall below a certain level, maintaining a baseline similarity among sentences in a chunk.

### `dynamicThresholdUpperBound`

- **Type**: Float
- **Default**: `0.8`
- **Description**: The maximum limit for dynamically adjusted similarity thresholds. This cap prevents the threshold from becoming too lenient, which could otherwise lead to overly large chunks with low cohesion.

### `numSimilaritySentencesLookahead`

- **Type**: Integer
- **Default**: `2`
- **Description**: Controls how many subsequent sentences are considered for calculating the maximum similarity to the current sentence during chunk formation. A higher value increases the chance of finding a suitable sentence to extend the current chunk but at the cost of increased computational overhead.

### `combineChunks`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Determines whether to perform a second pass to combine smaller chunks into larger ones, based on their semantic similarity and the `maxTokenSize`. This can enhance the readability of the output by grouping closely related content more effectively.

### `combineChunksSimilarityThreshold`

- **Type**: Float
- **Default**: `0.4`
- **Description**: Used in the second pass of chunk combination to decide if adjacent chunks should be merged, based on their similarity. Similar to `similarityThreshold`, but specifically for rebalancing existing chunks. Adjusting this parameter can help in fine-tuning the granularity of the final chunks.

### `onnxEmbeddingModel`

- **Type**: String
- **Default**: `Xenova/all-MiniLM-L6-v2`
- **Description**: Specifies the model used to generate sentence embeddings. Different models may yield different qualities of embeddings, affecting the chunking quality, especially in multilingual contexts.
- **Resource Link**: [ONNX Embedding Models](https://huggingface.co/models?pipeline_tag=feature-extraction&library=onnx&sort=trending)  
  Link to a filtered list of embedding models converted to ONNX library format by Xenova.  
  Refer to the Model table below for a list of suggested models and their sizes (choose a multilingual model if you need to chunk text other than English).  

### `device`

- **Type**: String
- **Default**: `cpu`
- **Description**: Specifies the execution provider for the model. Options are `cpu` and `webgpu`. Use `webgpu` to leverage GPU acceleration for faster processing. Note that WebGPU support may vary by environment.

#### `dtype`

- **Type**: String
- **Default**: `fp32`
- **Description**: Indicates the precision of the embedding model. Options are `fp32`, `fp16`, `q8`, `q4`.
`fp32` is the highest precision but also the largest size and slowest to load. `q8` is a good compromise between size and speed if the model supports it. All models support `fp32`, but only some support `fp16`, `q8`, and `q4`.


#### Curated ONNX Embedding Models

| Model                                        | Precision      | Link                                                                                                                                       | Size                   |
| -------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| nomic-ai/nomic-embed-text-v1.5               | fp32, q8       | [https://huggingface.co/nomic-ai/nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)                             | 548 MB, 138 MB         |
| thenlper/gte-base                            | fp32           | [https://huggingface.co/thenlper/gte-base](https://huggingface.co/thenlper/gte-base)                                                       | 436 MB                 |
| Xenova/all-MiniLM-L6-v2                      | fp32, fp16, q8 | [https://huggingface.co/Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)                                           | 23 MB, 45 MB, 90 MB    |
| Xenova/paraphrase-multilingual-MiniLM-L12-v2 | fp32, fp16, q8 | [https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2) | 470 MB, 235 MB, 118 MB |
| Xenova/all-distilroberta-v1                  | fp32, fp16, q8 | [https://huggingface.co/Xenova/all-distilroberta-v1](https://huggingface.co/Xenova/all-distilroberta-v1)                                   | 326 MB, 163 MB, 82 MB  |
| BAAI/bge-base-en-v1.5                        | fp32           | [https://huggingface.co/BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5)                                               | 436 MB                 |
| BAAI/bge-small-en-v1.5                       | fp32           | [https://huggingface.co/BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)                                             | 133 MB                 |
| yashvardhan7/snowflake-arctic-embed-m-onnx   | fp32           | [https://huggingface.co/yashvardhan7/snowflake-arctic-embed-m-onnx](https://huggingface.co/yashvardhan7/snowflake-arctic-embed-m-onnx)     | 436 MB                 |

Each of these parameters allows you to customize the `chunkit` function to better fit the text size, content complexity, and performance requirements of your application.

---

## Semantic Chunking Web UI

The Semantic Chunking Web UI allows you to experiment with the chunking parameters and see the results in real-time. This tool provides a visual way to test and configure the `semantic-chunking` library's settings to get optimal results for your specific use case. Once you've found the best settings, you can generate code to implement them in your project.

- Interactive controls for all chunking parameters
- Real-time text processing and results display
- Visual feedback for similarity thresholds
- Model selection and configuration
- Results download in JSON format
- Code generation with your settings
- Example texts for testing
- Dark mode interface

![Semantic Chunking Web UI](./img/semantic-chunking_web-ui.gif)

---

## `cramit` - 🧼 The Quick & Dirty

There is an additional function you can import to just "cram" sentences together till they meet your target token size for when you just need quick, high desity chunks.


## Parameters

`cramit` accepts an array of document objects and an optional configuration object. Here are the details for each parameter:

- `documents`: array of documents. each document is an object containing `document_name` and `document_text`.
  ```
  documents = [
    { document_name: "document1", document_text: "..." },
    { document_name: "document2", document_text: "..." },
    ...
  ]
  ```

- **Cramit Options Object:**
  
  - `logging`: Boolean (optional, default `false`) - Enables logging of detailed processing steps.
  - `maxTokenSize`: Integer (optional, default `500`) - Maximum token size for each chunk.
  - `onnxEmbeddingModel`: String (optional, default `Xenova/all-MiniLM-L6-v2`) - ONNX model used for creating embeddings.
  - `dtype`: String (optional, default `fp32`) - Precision of the embedding model (options: `fp32`, `fp16`, `q8`, `q4`).
  - `device`: String (optional, default `cpu`) - The execution provider to use for the model (options: `cpu`, `webgpu`).
  - `localModelPath`: String (optional, default `null`) - Local path to save and load models (example: `./models`).
  - `modelCacheDir`: String (optional, default `null`) - Directory to cache downloaded models (example: `./models`).
  - `returnEmbedding`: Boolean (optional, default `false`) - If set to `true`, each chunk will include an embedding vector. This is useful for applications that require semantic understanding of the chunks. The embedding model will be the same as the one specified in `onnxEmbeddingModel`.
  - `returnTokenLength`: Boolean (optional, default `false`) - If set to `true`, each chunk will include the token length. This can be useful for understanding the size of each chunk in terms of tokens, which is important for token-based processing limits. The token length is calculated using the tokenizer specified in `onnxEmbeddingModel`.
  - `chunkPrefix`: String (optional, default `null`) - A prefix to add to each chunk (e.g., "search_document: "). This is particularly useful when using embedding models that are trained with specific task prefixes, like the nomic-embed-text-v1.5 model. The prefix is added before calculating embeddings or token lengths.
  - `excludeChunkPrefixInResults`: Boolean (optional, default `false`) - If set to `true`, the chunk prefix will be removed from the results. This is useful when you want to remove the prefix from the results while still maintaining the prefix for embedding calculations.

Basic usage:

```javascript
import { cramit } from 'semantic-chunking';

let frogText = "A frog hops into a deli and croaks to the cashier, \"I'll have a sandwich, please.\" The cashier, surprised, quickly makes the sandwich and hands it over. The frog takes a big bite, looks around, and then asks, \"Do you have any flies to go with this?\" The cashier, taken aback, replies, \"Sorry, we're all out of flies today.\" The frog shrugs and continues munching on its sandwich, clearly unfazed by the lack of fly toppings. Just another day in the life of a sandwich-loving amphibian! 🐸🥪";

// initialize documents array and add the frog text to it
let documents = [];
documents.push({
    document_name: "frog document",
    document_text: frogText
});

// call the cramit function passing in the documents array and the options object
async function main() {
    let myFrogChunks = await cramit(documents, { maxTokenSize: 65 });
    console.log("myFrogChunks", myFrogChunks);
}
main();

```

Look at the `example\example-cramit.js` file in the root of this project for a more complex example of using all the optional parameters.

---

## `sentenceit` - ✂️ When you just need a Clean Split

There is an additional function you can import to just split sentences.


## Parameters

`sentenceit` accepts an array of document objects and an optional configuration object. Here are the details for each parameter:

- `documents`: array of documents. each document is an object containing `document_name` and `document_text`.
  ```
  documents = [
    { document_name: "document1", document_text: "..." },
    { document_name: "document2", document_text: "..." },
    ...
  ]
  ```

- **Sentenceit Options Object:**
  
  - `logging`: Boolean (optional, default `false`) - Enables logging of detailed processing steps.
  - `onnxEmbeddingModel`: String (optional, default `Xenova/all-MiniLM-L6-v2`) - ONNX model used for creating embeddings.
  - `dtype`: String (optional, default `fp32`) - Precision of the embedding model (options: `fp32`, `fp16`, `q8`, `q4`).
  - `device`: String (optional, default `cpu`) - The execution provider to use for the model (options: `cpu`, `webgpu`).
  - `localModelPath`: String (optional, default `null`) - Local path to save and load models (example: `./models`).
  - `modelCacheDir`: String (optional, default `null`) - Directory to cache downloaded models (example: `./models`).
  - `returnEmbedding`: Boolean (optional, default `false`) - If set to `true`, each chunk will include an embedding vector. This is useful for applications that require semantic understanding of the chunks. The embedding model will be the same as the one specified in `onnxEmbeddingModel`.
  - `returnTokenLength`: Boolean (optional, default `false`) - If set to `true`, each chunk will include the token length. This can be useful for understanding the size of each chunk in terms of tokens, which is important for token-based processing limits. The token length is calculated using the tokenizer specified in `onnxEmbeddingModel`.
  - `chunkPrefix`: String (optional, default `null`) - A prefix to add to each chunk (e.g., "search_document: "). This is particularly useful when using embedding models that are trained with specific task prefixes, like the nomic-embed-text-v1.5 model. The prefix is added before calculating embeddings or token lengths.
  - `excludeChunkPrefixInResults`: Boolean (optional, default `false`) - If set to `true`, the chunk prefix will be removed from the results. This is useful when you want to remove the prefix from the results while still maintaining the prefix for embedding calculations.

Basic usage:

```javascript
import { sentenceit } from 'semantic-chunking';

let duckText = "A duck waddles into a bakery and quacks to the baker, \"I'll have a loaf of bread, please.\" The baker, amused, quickly wraps the loaf and hands it over. The duck takes a nibble, looks around, and then asks, \"Do you have any seeds to go with this?\" The baker, chuckling, replies, \"Sorry, we're all out of seeds today.\" The duck nods and continues nibbling on its bread, clearly unfazed by the lack of seed toppings. Just another day in the life of a bread-loving waterfowl! 🦆🍞";

// initialize documents array and add the duck text to it
let documents = [];
documents.push({
    document_name: "duck document",
    document_text: duckText
});

// call the sentenceit function passing in the documents array and the options object
async function main() {
    let myDuckChunks = await sentenceit(documents, { returnEmbedding: true });
    console.log("myDuckChunks", myDuckChunks);
}
main();

```

Look at the `example\example-sentenceit.js` file in the root of this project for a more complex example of using all the optional parameters.

---

## 💾 Pre-Downloading Models

Fill out the `tools/download-models.list.json` file with a list of models you want pre-downloaded, and their precisions (See the Curated ONNX Embedding Models section above for a list of models to try). It is pre-populated with the list above; remove any models you don't want to download.
Run the `npm run download-models` command to download the models to the `models` directory.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/JItZqsL3umY/0.jpg)](https://www.youtube.com/watch?v=JItZqsL3umY)

---

## 🔍 RAG Tip!

If you are using this library for a RAG application, consider using the `chunkPrefix` option to add a prefix to each chunk. This can help improve the quality of the embeddings and reduce the amount of context needed to be passed to the LLM for embedding models that support task prefixes.

Chunk your large document like this:
```javascript
const largeDocumentText = await fs.promises.readFile('./large-document.txt', 'utf8');
const documents = [ 
    {
        document_name: "large document",
        document_text: largeDocumentText
    }
];
const myDocumentChunks = await chunkit(documents, { chunkPrefix: "search_document", returnEmbedding: true });
```

Get your search queries ready like this (use cramit for a quick large chunk):
```javascript
const documents = [
    { document_text: "What is the capital of France?" } 
];
const mySearchQueryChunk = await cramit(documents, { chunkPrefix: "search_query", returnEmbedding: true });
```

Now you can use the `myDocumentChunks` and `mySearchQueryChunk` results in your RAG application, feed them to a vector database, or find the closest match using cosine similarity in memory. The possibilities are many!

Happy Chunking!

---

## Appreciation
If you enjoy this library please consider sending me a tip to support my work 😀
### [🍵 tip me here](https://ko-fi.com/jparkerweb)
