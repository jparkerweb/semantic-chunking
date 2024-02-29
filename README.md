# 🍱 semantic-chunking
semantically create chunks from large text (useful for passing to LLM workflows)

---

### Install:
- `npm install semantic-chunking`

---

### Usage

```
import { chunkit } from 'semantic-chunking';

let text = "some long text...";
let myChunks = chunkit(text);
```

### All Parameters

```
chunkit(
    text,
    { // options object
        logging,
        maxTokenSize,
        similarityThreshold,
        onnxEmbeddingModel,
        onnxEmbeddingModelQuantized,
        combineSimilarityChunks
    }
)
```

- `text`  
  full string to split into chunks

- options object [optional]
  - `logging` [optional | boolean | default `false` ]  
  - `maxTokenSize` [optional | int | default `500`]  
  max possible token size of each chunk
  - `similarityThreshold` [optional | float | default `.567`]  
  threshold value used to determin if paired sentences are semantically close enough to be included in the same chunk
  - `onnxEmbeddingModel` [optional | string | default `Xenova/paraphrase-multilingual-MiniLM-L12-v2`]  
  ONNX model to use for creating embeddings for similarity comparison (model name on huggingface)
  - `onnxEmbeddingModelQuantized` [optional | boolean | default `true`]  
  if the quantized version of the model should be used
  - `combineSimilarityChunks` [optional | boolean | default `true`]  
  if true, the initial round of smaller semantic similar chunks are combined to make larger chunks up to the defined max token limit
---

### Workflow

- `text` is split into an array of `sentences`
- a `vector` is created for each `sentence`
- a `cosine similarity` score is created for each `sentence pair`
- each `sentence` is added to a chunk until the `similarity threshold` or `max token size` for the `chunk` is exceeded
- after all `similary chunks` are created `combine similary chunks` into `large chunks` up to the `max token size` unless the `combineSimilaryityChunks` was set to false

---

### Example Calls

```
import { chunkit } from 'semantic-chunking';

const text = await fs.promises.readFile('./example.txt', 'utf8');
let myChunks = await chunkit(text, { logging: true, similarityThreshold: .9 });

myChunks.forEach((chunk, index) => {
    console.log("--------------------");
    console.log("Chunk " + (index + 1));
    console.log("--------------------");
    console.log(chunk);
    console.log("\n\n");
});

```

```
import { chunkit } from 'semantic-chunking';

let frogText = "A frog hops into a deli and croaks to the cashier, \"I'll have a sandwich, please.\" The cashier, surprised, quickly makes the sandwich and hands it over. The frog takes a big bite, looks around, and then asks, \"Do you have any flies to go with this?\" The cashier, taken aback, replies, \"Sorry, we're all out of flies today.\" The frog shrugs and continues munching on its sandwich, clearly unfazed by the lack of fly toppings. Just another day in the life of a sandwich-loving amphibian! 🐸🥪";

let myFrogChunks = await chunkit(frogText, { maxTokenSize: 65 });
console.log("myFrogChunks", myFrogChunks);
```
