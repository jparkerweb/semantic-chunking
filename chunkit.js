// ===========================
// == 🍱 semantic-chunking ==
// ==================================================================
// == Semantically create chunks from large texts                  ==
// == Useful for workflows involving large language models (LLMs)  ==
// ==================================================================
// == npm package: https://www.npmjs.com/package/semantic-chunking ==
// == github repo: https://github.com/jparkerweb/semantic-chunking ==
// ==================================================================


// ---------------------
// -- library imports --
// ---------------------
import { env, pipeline, AutoTokenizer } from '@xenova/transformers';
import sentencize from '@stdlib/nlp-sentencize';

// ---------------------
// -- model variables --
// ---------------------
env.localModelPath = 'models/'; // local model path
env.cacheDir = 'models/';       // downloaded model cache directory
env.allowRemoteModels = true;   // allow remote models (required for models to be be downloaded)
let tokenizer;
let generateEmbedding;

// ------------------------
// -- default parameters --
// ------------------------
const LOGGING = false;
const MAX_TOKEN_SIZE = 500;
const SIMILARITY_THRESHOLD = .456;
const DYNAMIC_THRESHOLD_LOWER_BOUND = .2;
const DYNAMIC_THRESHOLD_UPPER_BOUND = .8;
const NUM_SIMILARITY_SENTENCES_LOOKAHEAD = 2;
const COMBINE_CHUNKS = true;
const COMBINE_CHUNKS_SIMILARITY_THRESHOLD = 0.4;
const ONNX_EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const ONNX_EMBEDDING_MODEL_QUANTIZED = true;


// ---------------------------
// -- Main chunkit function --
// ---------------------------
export async function chunkit(
    text,
    {
        logging = LOGGING,
        maxTokenSize = MAX_TOKEN_SIZE,
        similarityThreshold = SIMILARITY_THRESHOLD,
        dynamicThresholdLowerBound = DYNAMIC_THRESHOLD_LOWER_BOUND,
        dynamicThresholdUpperBound = DYNAMIC_THRESHOLD_UPPER_BOUND,
        numSimilaritySentencesLookahead = NUM_SIMILARITY_SENTENCES_LOOKAHEAD,
        combineChunks = COMBINE_CHUNKS,
        combineChunksSimilarityThreshold = COMBINE_CHUNKS_SIMILARITY_THRESHOLD,
        onnxEmbeddingModel = ONNX_EMBEDDING_MODEL,
        onnxEmbeddingModelQuantized = ONNX_EMBEDDING_MODEL_QUANTIZED,
    } = {}) {

    // Load the tokenizer
    tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel);

    // Create the embedding pipeline
    generateEmbedding = await pipeline('feature-extraction', onnxEmbeddingModel, {
        quantized: onnxEmbeddingModelQuantized,
    });

    // Split the text into sentences
    const sentences = sentencize(text);

    // Compute the similarities between sentences
    const { similarities, average, variance } = await computeAdvancedSimilarities(
        sentences,
        {
            numSimilaritySentencesLookahead: numSimilaritySentencesLookahead,
            logging: logging,
        }
    );

    // Dynamically adjust the similarity threshold based on variance and average
    let dynamicThreshold = similarityThreshold;
    if (average != null && variance != null) {
        dynamicThreshold = adjustThreshold(average, variance, similarityThreshold, dynamicThresholdLowerBound, dynamicThresholdUpperBound);
    }

    // Create the initial chunks using the adjusted threshold
    const initialChunks = createChunks(sentences, similarities, maxTokenSize, dynamicThreshold, logging);

    if (logging) {
        console.log('\n=============\ninitialChunks\n=============');
        initialChunks.forEach((chunk, index) => {
            console.log("\n");
            console.log(`--------------`);
            console.log(`-- Chunk ${(index + 1)} --`);
            console.log(`--------------`);
            console.log(chunk);
        });
    }

    // // combine similar chunks and balance sizes
    if (combineChunks) {
        const combinedChunks = await optimizeAndRebalanceChunks(initialChunks, tokenizer, maxTokenSize, combineChunksSimilarityThreshold);
        if (logging) {
            console.log('\n\n=============\ncombinedChunks\n=============');
            combinedChunks.forEach((chunk, index) => {
                console.log("\n\n\n");
                console.log("--------------------");
                console.log("Chunk " + (index + 1));
                console.log("--------------------");
                console.log(chunk);
            });
        }
        // Return the combined chunks
        return combinedChunks;
    } else {
        // Return the initial chunks
        return initialChunks;
    }
}


// --------------------------
// -- Main cramit function --
// --------------------------
export async function cramit(
    text,
    {
        logging = LOGGING,
        maxTokenSize = MAX_TOKEN_SIZE,
        onnxEmbeddingModel = ONNX_EMBEDDING_MODEL,
        onnxEmbeddingModelQuantized = ONNX_EMBEDDING_MODEL_QUANTIZED,
    } = {}) {

    // Load the tokenizer
    tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel);
    
    // Split the text into sentences
    const sentences = sentencize(text);
    
    // Create chunks
    const chunks = createChunks(sentences, null, maxTokenSize, 0, logging);
    
    if (logging) {
        console.log('\nCRAMIT');
        console.log('=============\nChunks\n=============');
        chunks.forEach((chunk, index) => {
            console.log("\n");
            console.log(`--------------`);
            console.log(`-- Chunk ${(index + 1)} --`);
            console.log(`--------------`);
            console.log(chunk);
        });
    }

    // Return chunks
    return chunks;
}




// **********************
// ** HELPER FUNCTIONS **
// **********************


// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
const embeddingCache = new Map();

async function createEmbedding(text) {
    if (embeddingCache.has(text)) return embeddingCache.get(text);

    const embeddings = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    embeddingCache.set(text, embeddings.data);
    return embeddings.data;
}


// ----------------------------------------------------------------------
// -- Function to create compute simple similarities between sentences --
// ----------------------------------------------------------------------
async function computeSimpleSimilarities(sentences) {
    const embeddings = await Promise.all(sentences.map(sentence => createEmbedding(sentence)));
    let similarities = [];

    for (let i = 0; i < embeddings.length - 1; i++) {
        const sim = cosineSimilarity(embeddings[i], embeddings[i + 1]);
        similarities.push(sim);
    }

    return similarities;
}


// ---------------------------------------------------------------
// -- Function to compute advanced similarities with statistics --
// ---------------------------------------------------------------
async function computeAdvancedSimilarities(sentences, { numSimilaritySentencesLookahead = 2, logging = false } = {}) {
    if (logging) console.log('numSimilaritySentencesLookahead', numSimilaritySentencesLookahead);

    const embeddings = await Promise.all(sentences.map(sentence => createEmbedding(sentence)));
    let similarities = [];
    let similaritySum = 0;

    for (let i = 0; i < embeddings.length - 1; i++) {
        let maxSimilarity = cosineSimilarity(embeddings[i], embeddings[i + 1]);

        for (let j = i + 2; j <= i + numSimilaritySentencesLookahead && j < embeddings.length; j++) {
            const sim = cosineSimilarity(embeddings[i], embeddings[j]);
            maxSimilarity = Math.max(maxSimilarity, sim);
        }

        similarities.push(maxSimilarity);
        similaritySum += maxSimilarity;
    }

    const average = similaritySum / similarities.length;
    const variance = similarities.reduce((acc, sim) => acc + (sim - average) ** 2, 0) / similarities.length;

    return { similarities, average, variance };
}


// -----------------------------------------------------------
// -- Function to dynamically adjust the similarity threshold --
// -----------------------------------------------------------
function adjustThreshold(average, variance, baseThreshold = 0.5, lowerBound = 0.2, upperBound = 0.8) {
    // Validate bounds to ensure lowerBound is less than upperBound
    if (lowerBound >= upperBound) {
        console.error("Invalid bounds: lowerBound must be less than upperBound.");
        return baseThreshold; // Fallback to baseThreshold if bounds are invalid
    }

    // Initial threshold adjustment based on variance
    let adjustedThreshold = baseThreshold;
    if (variance < 0.01) {        // Low variance, more uniform text
        adjustedThreshold -= 0.1; // Lower the threshold to be more inclusive
    } else if (variance > 0.05) { // High variance, diverse text
        adjustedThreshold += 0.1; // Increase the threshold to be more exclusive
    }

    // Further adjust based on the average similarity
    if (average < 0.3) {           // Low average similarity
        adjustedThreshold += 0.05; // Increase the threshold to avoid merging too different sentences
    } else if (average > 0.7) {    // High average similarity
        adjustedThreshold -= 0.05; // Decrease the threshold to be more inclusive
    }

    // Ensure the threshold remains within the validated bounds
    return Math.min(Math.max(adjustedThreshold, lowerBound), upperBound);
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
function createChunks(sentences, similarities, maxTokenSize, similarityThreshold, logging) {
    let chunks = [];
    let currentChunk = [sentences[0]];
    let currentChunkSize;
    let sentenceTokenCount;

    if (logging) { console.log(`!! new chunk !! --> 1`) }

    for (let i = 1; i < sentences.length; i++) {
        currentChunkSize = tokenizer(currentChunk.join(" ")).input_ids.size;
        sentenceTokenCount = tokenizer(sentences[i]).input_ids.size;

        if (logging) {
            console.log('sentenceTokenCount', sentenceTokenCount);
            console.log('currentChunkSize', currentChunkSize);
            console.log('maxTokenSize', maxTokenSize);
            if (similarities) {
                console.log('similarity', similarities[i - 1])
                console.log('similarityThreshold', similarityThreshold)
            }
        }

        if (similarities) {
            if (similarities[i - 1] >= similarityThreshold && currentChunkSize + sentenceTokenCount <= maxTokenSize) {
                currentChunk.push(sentences[i]);

                if (logging) { console.log('keep going...') }
            } else {
                chunks.push(currentChunk.join(" "));
                currentChunk = [sentences[i]];

                if (logging) {
                    console.log('stop...')
                    console.log('\n')
                    console.log(`!! new chunk !! --> ${chunks.length + 1}`)
                }
            }
        } else {
            if (currentChunkSize + sentenceTokenCount <= maxTokenSize) {
                currentChunk.push(sentences[i]);

                if (logging) { console.log('keep going...') }
            } else {
                chunks.push(currentChunk.join(" "));
                currentChunk = [sentences[i]];

                if (logging) {
                    console.log('stop...')
                    console.log('\n')
                    console.log(`!! new chunk !! --> ${chunks.length + 1}`)
                }
            }
        }
    }

    // Add the last chunk if it's not empty
    if (currentChunk.length > 0 && currentChunk[0] !== "") {
        chunks.push(currentChunk.join(" "));
    }

    return chunks;
}


// --------------------------------------------------------------
// -- Optimize and Rebalance Chunks (optionaly use Similarity) --
// --------------------------------------------------------------
async function optimizeAndRebalanceChunks(combinedChunks, tokenizer, maxTokenSize, combineChunksSimilarityThreshold = 0.5) {
    let optimizedChunks = [];
    let currentChunkText = "";
    let currentChunkTokenCount = 0;
    let currentEmbedding = null;

    for (let index = 0; index < combinedChunks.length; index++) {
        const chunk = combinedChunks[index];
        const chunkTokenCount = tokenizer(chunk).input_ids.size;

        if (currentChunkText && (currentChunkTokenCount + chunkTokenCount <= maxTokenSize)) {
            const nextEmbedding = await createEmbedding(chunk);
            const similarity = currentEmbedding ? cosineSimilarity(currentEmbedding, nextEmbedding) : 0;

            if (similarity >= combineChunksSimilarityThreshold) {
                currentChunkText += " " + chunk;
                currentChunkTokenCount += chunkTokenCount;
                currentEmbedding = nextEmbedding; // Assume combined embedding
                continue;
            }
        }

        if (currentChunkText) optimizedChunks.push(currentChunkText);
        currentChunkText = chunk;
        currentChunkTokenCount = chunkTokenCount;
        currentEmbedding = await createEmbedding(chunk);
    }

    if (currentChunkText) optimizedChunks.push(currentChunkText);

    return optimizedChunks.filter(chunk => chunk);
}
