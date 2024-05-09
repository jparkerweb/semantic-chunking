# 🍱 semantic-chunking

Semantically create chunks from large texts.  
Useful for workflows involving large language models (LLMs).

## Install

```bash
npm install semantic-chunking
```

## Usage

Basic usage:

```javascript
import { chunkit } from 'semantic-chunking';

const text = "some long text...";
const chunkitOptions = {};
const myChunks = await chunkit(text, chunkitOptions);

```

**NOTE** 🚨 The Embedding model (`onnxEmbeddingModel`) will be downloaded to this package's cache directory the first it is run (file size will depend on the specified model; see the model's table ).

## Parameters

`chunkit` accepts a text string and an optional configuration object. Here are the details for each parameter:

- `text`: String to be split into chunks.
  
- **Chunkit Options Object:**
  
  - `logging`: Boolean (optional, default `false`) - Enables logging of detailed processing steps.
  - `maxTokenSize`: Integer (optional, default `500`) - Maximum token size for each chunk.
  - `similarityThreshold`: Float (optional, default `0.456`) - Threshold to determine if sentences are similar enough to be in the same chunk. A higher value demands higher similarity.
  - `dynamicThresholdLowerBound`: Float (optional, default `0.2`) - Minimum possible dynamic similarity threshold.
  - `dynamicThresholdUpperBound`: Float (optional, default `0.8`) - Maximum possible dynamic similarity threshold.
  - `numSimilaritySentencesLookahead`: Integer (optional, default `2`) - Number of sentences to look ahead for calculating similarity.
  - `combineChunks`: Boolean (optional, default `true`) - Determines whether to reblance and combine chunks into larger ones up to the max token limit.
  - `combineChunksSimilarityThreshold`: Float (optional, default `0.5`) - Threshold for combining chunks based on similarity during the rebalance and combining phase.
  - `onnxEmbeddingModel`: String (optional, default `Xenova/all-MiniLM-L6-v2`) - ONNX model used for creating embeddings.
  - `onnxEmbeddingModelQuantized`: Boolean (optional, default `true`) - Indicates whether to use a quantized version of the embedding model.

## Workflow

1. **Sentence Splitting**: The input text is split into an array of sentences.
2. **Embedding Generation**: A vector is created for each sentence using the specified ONNX model.
3. **Similarity Calculation**: Cosine similarity scores are calculated for each sentence pair.
4. **Chunk Formation**: Sentences are grouped into chunks based on the similarity threshold and max token size.
5. **Chunk Rebalancing**: Optionally, similar adjacent chunks are combined into larger ones up to the max token size.

## Examples

Example 1: Basic usage with custom similarity threshold:

```javascript
import { chunkit } from 'semantic-chunking';
import fs from 'fs';

async function main() {
    const text = await fs.promises.readFile('./test.txt', 'utf8');
    let myChunks = await chunkit(text, { similarityThreshold: 0.3 });

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

let frogText = "A frog hops into a deli and croaks to the cashier, \"I'll have a sandwich, please.\" The cashier, surprised, quickly makes the sandwich and hands it over. The frog takes a big bite, looks around, and then asks, \"Do you have any flies to go with this?\" The cashier, taken aback, replies, \"Sorry, we're all out of flies today.\" The frog shrugs and continues munching on its sandwich, clearly unfazed by the lack of fly toppings. Just another day in the life of a sandwich-loving amphibian! 🐸🥪";

async function main() {
    let myFrogChunks = await chunkit(frogText, { maxTokenSize: 65 });
    console.log("myFrogChunks", myFrogChunks);
}
main();

```

Look at the `example.js` file in the root of this project for a more complex example of using all the optional parameters.


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
- **Default**: `Xenova/paraphrase-multilingual-MiniLM-L12-v2`
- **Description**: Specifies the model used to generate sentence embeddings. Different models may yield different qualities of embeddings, affecting the chunking quality, especially in multilingual contexts.
- **Resource Link**: [ONNX Embedding Models](https://huggingface.co/models?pipeline_tag=feature-extraction&library=onnx&sort=trending)  
  Link to a filtered list of embedding models converted to ONNX library format by Xenova.  
  Refer to the Model table below for a list of suggested models and their sizes (choose a multilingual model if you need to chunk text other than English).  

### `onnxEmbeddingModelQuantized`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Indicates whether to use a quantized version of the specified model. Quantized models generally offer faster performance with a slight trade-off in accuracy, which can be beneficial when processing very large datasets.


#### Curated ONNX Embedding Models

| Model                                        | Quantized | Link                                                                                                                                       | Size    |
| -------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Xenova/all-MiniLM-L6-v2                      | true      | [https://huggingface.co/Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)                                           | 23 MB   |
| Xenova/all-MiniLM-L6-v2                      | false     | [https://huggingface.co/Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)                                           | 90.4 MB |
| Xenova/paraphrase-multilingual-MiniLM-L12-v2 | true      | [https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2) | 118 MB  |
| Xenova/all-distilroberta-v1                  | true      | [https://huggingface.co/Xenova/all-distilroberta-v1](https://huggingface.co/Xenova/all-distilroberta-v1)                                   | 82.1 MB |
| Xenova/all-distilroberta-v1                  | false     | [https://huggingface.co/Xenova/all-distilroberta-v1](https://huggingface.co/Xenova/all-distilroberta-v1)                                   | 326 MB  |
| BAAI/bge-base-en-v1.5                        | false     | [https://huggingface.co/BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5)                                               | 436 MB  |
| BAAI/bge-small-en-v1.5                       | false     | [https://huggingface.co/BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)                                             | 133 MB  |

Each of these parameters allows you to customize the `chunkit` function to better fit the text size, content complexity, and performance requirements of your application.