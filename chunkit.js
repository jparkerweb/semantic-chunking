// ===========================
// == 🍱 semantic-chunking ==
// ==================================================================
// == Semantically create chunks from large texts                  ==
// == Useful for workflows involving large language models (LLMs)  ==
// ==================================================================
// == npm package: https://www.npmjs.com/package/semantic-chunking ==
// == github repo: https://github.com/jparkerweb/semantic-chunking ==
// ==================================================================

import { parseSentences } from 'sentence-parse';
import { DEFAULT_CONFIG } from './config.js';
import { initializeEmbeddingUtils, tokenizer, createEmbedding } from './embeddingUtils.js';
import { computeAdvancedSimilarities, adjustThreshold } from './similarityUtils.js';
import { createChunks, optimizeAndRebalanceChunks, applyPrefixToChunk } from './chunkingUtils.js';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const VERSION = packageJson.version;

export async function printVersion() {
    const versionText = `-- semantic-chunking v${VERSION} --`;
    const lineLength = versionText.length;
    console.log(`\n${'-'.repeat(lineLength)}\n${versionText}\n${'-'.repeat(lineLength)}`);
}

// ---------------------------
// -- Main chunkit function --
// ---------------------------
export async function chunkit(
    documents,
    {
        logging = DEFAULT_CONFIG.LOGGING,
        maxTokenSize = DEFAULT_CONFIG.MAX_TOKEN_SIZE,
        similarityThreshold = DEFAULT_CONFIG.SIMILARITY_THRESHOLD,
        dynamicThresholdLowerBound = DEFAULT_CONFIG.DYNAMIC_THRESHOLD_LOWER_BOUND,
        dynamicThresholdUpperBound = DEFAULT_CONFIG.DYNAMIC_THRESHOLD_UPPER_BOUND,
        numSimilaritySentencesLookahead = DEFAULT_CONFIG.NUM_SIMILARITY_SENTENCES_LOOKAHEAD,
        combineChunks = DEFAULT_CONFIG.COMBINE_CHUNKS,
        combineChunksSimilarityThreshold = DEFAULT_CONFIG.COMBINE_CHUNKS_SIMILARITY_THRESHOLD,
        onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
        dtype = DEFAULT_CONFIG.DTYPE,
        localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
        modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
        returnEmbedding = DEFAULT_CONFIG.RETURN_EMBEDDING,
        returnTokenLength = DEFAULT_CONFIG.RETURN_TOKEN_LENGTH,
        chunkPrefix = DEFAULT_CONFIG.CHUNK_PREFIX,
        excludeChunkPrefixInResults = false,
    } = {}) {

    if(logging) { printVersion(); }

    // Input validation
    if (!Array.isArray(documents)) {
        throw new Error('Input must be an array of document objects');
    }

    // Initialize embedding utilities and set optional paths
    const { modelName, dtype: usedDtype } = await initializeEmbeddingUtils(
        onnxEmbeddingModel, 
        dtype,
        localModelPath,
        modelCacheDir
    );

    // Process each document
    const allResults = await Promise.all(documents.map(async (doc) => {
        if (!doc.document_text) {
            throw new Error('Each document must have a document_text property');
        }

        // Normalize document text by converting single line breaks to spaces
        // but preserving multiple line breaks
        let normalizedText = doc.document_text.replace(/([^\n])\n([^\n])/g, '$1 $2');
        // Convert multiple spaces to single space
        normalizedText = normalizedText.replace(/\s{2,}/g, ' ');
        doc.document_text = normalizedText;

        // Split the text into sentences
        const sentences = await parseSentences(doc.document_text);

        // Compute similarities and create chunks
        const { similarities, average, variance } = await computeAdvancedSimilarities(
            sentences,
            {
                numSimilaritySentencesLookahead,
                logging,
            }
        );

        // Dynamically adjust the similarity threshold based on variance and average
        let dynamicThreshold = similarityThreshold;
        if (average != null && variance != null) {
            dynamicThreshold = adjustThreshold(average, variance, similarityThreshold, dynamicThresholdLowerBound, dynamicThresholdUpperBound);
        }

        // Create the initial chunks using the adjusted threshold
        const initialChunks = createChunks(sentences, similarities, maxTokenSize, dynamicThreshold, logging);

        // Log initial chunks if needed
        if (logging) {
            console.log('\n=============\ninitialChunks\n=============');
            initialChunks.forEach((chunk, index) => {
                console.log("\n");
                console.log(`--------------`);
                console.log(`-- Chunk ${(index + 1)} --`);
                console.log(`--------------`);
                console.log(chunk.substring(0, 50) + '...');
            });
        }

        let finalChunks;

        // Combine similar chunks and balance sizes if requested
        if (combineChunks) {
            finalChunks = await optimizeAndRebalanceChunks(initialChunks, tokenizer, maxTokenSize, combineChunksSimilarityThreshold);
            if (logging) {
                console.log('\n\n=============\ncombinedChunks\n=============');
                finalChunks.forEach((chunk, index) => {
                    console.log("\n\n\n");
                    console.log("--------------------");
                    console.log("Chunk " + (index + 1));
                    console.log("--------------------");
                    console.log(chunk.substring(0, 50) + '...');
                });
            }
        } else {
            finalChunks = initialChunks;
        }

        const documentName = doc.document_name || ""; // Normalize document_name
        const documentId = Date.now();
        const numberOfChunks = finalChunks.length;

        return Promise.all(finalChunks.map(async (chunk, index) => {
            const prefixedChunk = applyPrefixToChunk(chunkPrefix, chunk);
            const result = {
                document_id: documentId,
                document_name: documentName,
                number_of_chunks: numberOfChunks,
                chunk_number: index + 1,
                model_name: modelName,
                dtype: usedDtype,
                text: prefixedChunk
            };

            if (returnEmbedding) {
                result.embedding = await createEmbedding(prefixedChunk);
            }

            if (returnTokenLength) {
                try {
                    const encoded = await tokenizer(prefixedChunk, { padding: true });
                    if (encoded && encoded.input_ids) {
                        result.token_length = encoded.input_ids.size;
                    } else {
                        console.error('Tokenizer returned unexpected format:', encoded);
                        result.token_length = 0;
                    }
                } catch (error) {
                    console.error('Error during tokenization:', error);
                    result.token_length = 0;
                }
            }

            // Remove prefix if requested (after embedding calculation)
            if (excludeChunkPrefixInResults && chunkPrefix && chunkPrefix.trim()) {
                const prefixPattern = new RegExp(`^${chunkPrefix}:\\s*`);
                result.text = result.text.replace(prefixPattern, '');
            }

            return result;
        }));
    }));

    // Flatten the results array since we're processing multiple documents
    return allResults.flat();
}

// --------------------------
// -- Main cramit function --
// --------------------------
export async function cramit(
    documents,
    {
        logging = DEFAULT_CONFIG.LOGGING,
        maxTokenSize = DEFAULT_CONFIG.MAX_TOKEN_SIZE,
        onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
        dtype = DEFAULT_CONFIG.DTYPE,
        localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
        modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
        returnEmbedding = DEFAULT_CONFIG.RETURN_EMBEDDING,
        returnTokenLength = DEFAULT_CONFIG.RETURN_TOKEN_LENGTH,
        chunkPrefix = DEFAULT_CONFIG.CHUNK_PREFIX,
        excludeChunkPrefixInResults = false,
    } = {}) {

    if(logging) { printVersion(); }

    // Input validation
    if (!Array.isArray(documents)) {
        throw new Error('Input must be an array of document objects');
    }

    // Initialize embedding utilities with paths
    await initializeEmbeddingUtils(
        onnxEmbeddingModel, 
        dtype,
        localModelPath,
        modelCacheDir
    );

    // Process each document
    const allResults = await Promise.all(documents.map(async (doc) => {
        if (!doc.document_text) {
            throw new Error('Each document must have a document_text property');
        }

        // Split the text into sentences
        const sentences = await parseSentences(doc.document_text);
        
        // Create chunks without considering similarities
        const chunks = createChunks(sentences, null, maxTokenSize, 0, logging);
        
        if (logging) {
            console.log('\nCRAMIT');
            console.log('=============\nChunks\n=============');
            chunks.forEach((chunk, index) => {
                console.log("\n");
                console.log(`--------------`);
                console.log(`-- Chunk ${(index + 1)} --`);
                console.log(`--------------`);
                console.log(chunk.substring(0, 50) + '...');
            });
        }

        const documentName = doc.document_name || ""; // Normalize document_name
        const documentId = Date.now();
        const numberOfChunks = chunks.length;

        return Promise.all(chunks.map(async (chunk, index) => {
            const prefixedChunk = applyPrefixToChunk(chunkPrefix, chunk);
            const result = {
                document_id: documentId,
                document_name: documentName,
                number_of_chunks: numberOfChunks,
                chunk_number: index + 1,
                model_name: onnxEmbeddingModel,
                dtype: dtype,
                text: prefixedChunk
            };

            if (returnEmbedding) {
                result.embedding = await createEmbedding(prefixedChunk);
            }

            if (returnTokenLength) {
                try {
                    const encoded = await tokenizer(prefixedChunk, { padding: true });
                    if (encoded && encoded.input_ids) {
                        result.token_length = encoded.input_ids.size;
                    } else {
                        console.error('Tokenizer returned unexpected format:', encoded);
                        result.token_length = 0;
                    }
                } catch (error) {
                    console.error('Error during tokenization:', error);
                    result.token_length = 0;
                }
            }

            // Remove prefix if requested (after embedding calculation)
            if (excludeChunkPrefixInResults && chunkPrefix && chunkPrefix.trim()) {
                const prefixPattern = new RegExp(`^${chunkPrefix}:\\s*`);
                result.text = result.text.replace(prefixPattern, '');
            }

            return result;
        }));
    }));

    // Flatten the results array since we're processing multiple documents
    return allResults.flat();
}


// ------------------------------
// -- Main sentenceit function --
// ------------------------------
export async function sentenceit(
    documents,
    {
        logging = DEFAULT_CONFIG.LOGGING,
        onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
        dtype = DEFAULT_CONFIG.DTYPE,
        localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
        modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
        returnEmbedding = DEFAULT_CONFIG.RETURN_EMBEDDING,
        returnTokenLength = DEFAULT_CONFIG.RETURN_TOKEN_LENGTH,
        chunkPrefix = DEFAULT_CONFIG.CHUNK_PREFIX,
        excludeChunkPrefixInResults = false,
    } = {}) {

    if(logging) { printVersion(); }

    // Input validation
    if (!Array.isArray(documents)) {
        throw new Error('Input must be an array of document objects');
    }

    if (returnEmbedding) {
        // Initialize embedding utilities with paths
        await initializeEmbeddingUtils(
            onnxEmbeddingModel, 
            dtype,
            localModelPath,
            modelCacheDir
        );
    }

    // Process each document
    const allResults = await Promise.all(documents.map(async (doc) => {
        if (!doc.document_text) {
            throw new Error('Each document must have a document_text property');
        }

        // Split the text into sentences
        const chunks = await parseSentences(doc.document_text);
        
        if (logging) {
            console.log('\nSENTENCEIT');
            console.log('=============\nSentences\n=============');
            chunks.forEach((chunk, index) => {
                console.log("\n");
                console.log(`--------------`);
                console.log(`-- Sentence ${(index + 1)} --`);
                console.log(`--------------`);
                console.log(chunk.substring(0, 50) + '...');
            });
        }

        const documentName = doc.document_name || ""; // Normalize document_name
        const documentId = Date.now();
        const numberOfChunks = chunks.length;

        return Promise.all(chunks.map(async (chunk, index) => {
            const prefixedChunk = chunkPrefix ? applyPrefixToChunk(chunkPrefix, chunk) : chunk;
            const result = {
                document_id: documentId,
                document_name: documentName,
                number_of_sentences: numberOfChunks,
                sentence_number: index + 1,
                text: prefixedChunk
            };

            if (returnEmbedding) {
                result.model_name = onnxEmbeddingModel;
                result.dtype = dtype;
                result.embedding = await createEmbedding(prefixedChunk);
    
                if (returnTokenLength) {
                    try {
                        const encoded = await tokenizer(prefixedChunk, { padding: true });
                        if (encoded && encoded.input_ids) {
                            result.token_length = encoded.input_ids.size;
                        } else {
                            console.error('Tokenizer returned unexpected format:', encoded);
                            result.token_length = 0;
                        }
                    } catch (error) {
                        console.error('Error during tokenization:', error);
                        result.token_length = 0;
                    }
                }

                // Remove prefix if requested (after embedding calculation)
                if (excludeChunkPrefixInResults && chunkPrefix && chunkPrefix.trim()) {
                    const prefixPattern = new RegExp(`^${chunkPrefix}:\\s*`);
                    result.text = result.text.replace(prefixPattern, '');
                }
            }

            return result;
        }));
    }));

    // Flatten the results array since we're processing multiple documents
    return allResults.flat();
}
