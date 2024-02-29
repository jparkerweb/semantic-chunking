import { env, pipeline, AutoTokenizer } from '@xenova/transformers';
import fs from 'fs';

env.localModelPath = 'models/';
env.cacheDir = 'models/';
env.allowRemoteModels = true;

const ONNX_EMBEDDING_MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const ONNX_EMBEDDING_MODEL_QUANTIZED = true;
const MAX_TOKEN_SIZE = 500;
const SIMILARITY_THRESHOLD = .567;

const tokenizer = await AutoTokenizer.from_pretrained(ONNX_EMBEDDING_MODEL);


// -----------------------------------
// -- Create the embedding pipeline --
// -----------------------------------
const generateEmbedding = await pipeline('feature-extraction', ONNX_EMBEDDING_MODEL, {
    quantized: ONNX_EMBEDDING_MODEL_QUANTIZED,
});


// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
async function createEmbedding(text) {
    const embeddings = await generateEmbedding(text, {
        pooling: 'mean',
        normalize: true,
    });

    return embeddings.data;
}


// -------------------------------------------
// -- Function to split text into sentences --
// -------------------------------------------
function splitTextIntoSentences(text) {
    return text.match(/[^.!?]+[.!?]+|\s*\n\s*/g) || [text]; // Split by sentences or new lines
}


// ---------------------------------------------------------------
// -- Function to create compute similarities between sentences --
// ---------------------------------------------------------------
async function computeSimilarities(sentences) {
    const embeddings = await Promise.all(sentences.map(sentence => createEmbedding(sentence)));
    let similarities = [];
    for (let i = 0; i < embeddings.length - 1; i++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[i + 1]);
      similarities.push(sim);
    }
    return similarities;
}


// -----------------------------------------------------
// -- Calculate cosine similarity between two vectors --
// -----------------------------------------------------
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0; // To avoid division by zero
    } else {
      return dotProduct / (normA * normB);
    }
}


// -----------------------------------------------------------
// -- Function to create chunks of text based on similarity --
// -----------------------------------------------------------
function createChunks(sentences, similarities, maxTokenSize, similarityThreshold) {
    let chunks = [];
    let currentChunk = [sentences[0]];


    let currentChunkSize;
    let sentenceTokenCount;
    console.log(`!! new chunk !! --> 1`)
    
    for (let i = 1; i < sentences.length; i++) {
      currentChunkSize = tokenizer(currentChunk.join(" ")).input_ids.size;
      sentenceTokenCount = tokenizer(sentences[i]).input_ids.size;
      console.log('sentenceTokenCount', sentenceTokenCount);
      console.log('currentChunkSize', currentChunkSize);
      console.log('maxTokenSize', maxTokenSize)
      console.log('similarity', similarities[i - 1])
      console.log('similarityThreshold', similarityThreshold)

      if (similarities[i - 1] >= similarityThreshold && currentChunkSize  + sentenceTokenCount <= maxTokenSize) {
          currentChunk.push(sentences[i]);
          console.log('keep going...')
      } else {
          chunks.push(currentChunk.join(" "));
          currentChunk = [sentences[i]];
          console.log('stop...')
          console.log('\n')
          console.log(`!! new chunk !! --> ${chunks.length + 1}`)
      }
    }
  
    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }
  
    return chunks;
}


// ---------------------------------------------
// -- Function to combine chunks by max tokens --
// ---------------------------------------------
function combineChunks(initialChunks, maxTokenSize, tokenizer) {
    let combinedChunks = [];
    let currentChunkTokenCount = 0; // This will store the number of tokens in the current chunk
    let currentChunkText = "";

    initialChunks.forEach(chunk => {
        const chunkTokenCount = tokenizer(chunk).input_ids.size; // This is a number
        if (currentChunkTokenCount + chunkTokenCount <= maxTokenSize) {
            // Add to current chunk
            currentChunkText += (currentChunkText ? " " : "") + chunk; // Add a space if not the first chunk
            currentChunkTokenCount += chunkTokenCount; // Increase the token count for the current chunk
        } else {
            // Current chunk is full, push it and start a new one
            if (currentChunkText) { // Make sure we don't add empty chunks
                combinedChunks.push(currentChunkText);
            }
            currentChunkText = chunk;
            currentChunkTokenCount = chunkTokenCount; // Reset the token count for the new chunk
        }
    });

    // Don't forget to add the last chunk if it's not empty
    if (currentChunkText) {
        combinedChunks.push(currentChunkText);
    }

    return combinedChunks;
}




// -------------------
// -- Main function --
// -------------------
async function main() {
    const text = await fs.promises.readFile('./example.txt', 'utf8');
    const sentences = splitTextIntoSentences(text);
    const similarities = await computeSimilarities(sentences);

    const initialChunks = createChunks(sentences, similarities, MAX_TOKEN_SIZE, SIMILARITY_THRESHOLD);
    console.log('\n\n=============\ninitialChunks\n=============');
    initialChunks.forEach((chunk, index) => {
        console.log("\n\n\n");
        console.log("--------------------");
        console.log("Chunk " + (index + 1));
        console.log("--------------------");
        console.log(chunk);
    });
    
    
    // Combine initial chunks into larger ones without exceeding maxTokenSize
    const combinedChunks = combineChunks(initialChunks, MAX_TOKEN_SIZE, tokenizer);
    console.log('\n\n=============\ncombinedChunks\n=============');
    combinedChunks.forEach((chunk, index) => {
        console.log("\n\n\n");
        console.log("--------------------");
        console.log("Chunk " + (index + 1));
        console.log("--------------------");
        console.log(chunk);
    });
}



// ---------------------------
// -- Run the main function --
// ---------------------------
main().catch(console.error);
