// ====================================
// == 🍱 semantic-chunking / pipeline ==
// ==========================================================================
// The document-processing pipelines behind chunkit / cramit / sentenceit,
// extracted verbatim from the 2.x function bodies and parameterized by an
// embedding context (see embedding-context.js) instead of module globals.
// Chunk boundaries, ordering, and token counts are identical to 2.x; the only
// intentional change is that chunkit's final chunk-embedding pass is batched
// (one model run for all chunks instead of one run per chunk).
// ==========================================================================

import { parseSentences } from 'sentence-parse';
import { computeAdvancedSimilarities, adjustThreshold } from './similarityUtils.js';
import { createChunks, optimizeAndRebalanceChunks, applyPrefixToChunk } from './chunkingUtils.js';

/**
 * Wraps a scope's embedBatch so failures carry the calling function's label
 * (matches the 2.x error messages, e.g. "cramit embedding failed: ...").
 * @param {function(string[]): Promise<Array>} embedBatch - Scope embed function.
 * @param {string} label - Error prefix ('Embedding' for chunkit parity).
 * @returns {function(string[]): Promise<Array>} Wrapped embed function.
 */
function labelEmbedErrors(embedBatch, label) {
    return async (texts) => {
        try {
            return await embedBatch(texts);
        } catch (error) {
            throw new Error(`${label} failed: ${error.message}`);
        }
    };
}

/**
 * chunkit pipeline: sentence split -> similarity -> chunk -> optional
 * multi-pass merge -> assemble (batched final embeddings).
 * @param {Object} ctx - Embedding context (embedding-context.js).
 * @param {Array} documents - Document objects with document_text.
 * @param {Object} opts - Per-call chunking options (already defaulted).
 * @returns {Promise<Array>} Flat chunk results across all documents.
 */
export async function runChunkit(ctx, documents, opts) {
    const {
        logging,
        maxTokenSize,
        similarityThreshold,
        dynamicThresholdLowerBound,
        dynamicThresholdUpperBound,
        numSimilaritySentencesLookahead,
        combineChunks,
        combineChunksSimilarityThreshold,
        returnEmbedding,
        returnTokenLength,
        chunkPrefix,
        excludeChunkPrefixInResults,
        excludeNonLetterSentences,
        maxMergesPerPass,
        maxUncappedPasses,
        maxMergesPerPassPercentage,
        uncappedCandidateMerges,
    } = opts;

    if (!Array.isArray(documents)) {
        throw new Error('Input must be an array of document objects');
    }

    const embedBatch = labelEmbedErrors(ctx.createScope().embedBatch, 'Embedding');
    const countTokens = (text) => ctx.countTokens(text);

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
        const sentences = await parseSentences(doc.document_text, { excludeNonLetterSentences });

        // Compute similarities and create chunks
        const { similarities, average, variance, embeddings } = await computeAdvancedSimilarities(
            sentences,
            {
                numSimilaritySentencesLookahead,
                logging,
            },
            embedBatch
        );

        // Store embeddings indexed by sentence for merge phase
        const sentenceEmbeddings = new Map();
        sentences.forEach((sentence, index) => {
            sentenceEmbeddings.set(sentence, embeddings[index]);
        });

        // Dynamically adjust the similarity threshold based on variance and average
        let dynamicThreshold = similarityThreshold;
        if (average != null && variance != null) {
            dynamicThreshold = adjustThreshold(average, variance, similarityThreshold, dynamicThresholdLowerBound, dynamicThresholdUpperBound);
        }

        // Create the initial chunks using the adjusted threshold
        const initialChunks = createChunks(sentences, similarities, maxTokenSize, dynamicThreshold, logging, countTokens);

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
            // Convert initialChunks (strings) to chunk objects with text and tokenCount
            const chunkObjects = initialChunks.map(chunkText => ({
                text: chunkText,
                tokenCount: countTokens(chunkText)
            }));

            // Ensure embeddings exist for chunks not in sentenceEmbeddings
            // (chunks may be composed of multiple sentences)
            const chunksNeedingEmbeddings = chunkObjects.filter(
                chunk => !sentenceEmbeddings.has(chunk.text)
            );
            if (chunksNeedingEmbeddings.length > 0) {
                const textsToEmbed = chunksNeedingEmbeddings.map(c => c.text);
                const newEmbeddings = await embedBatch(textsToEmbed);
                chunksNeedingEmbeddings.forEach((chunk, i) => {
                    sentenceEmbeddings.set(chunk.text, newEmbeddings[i]);
                });
            }

            const mergeOptions = {
                maxMergesPerPass,
                maxUncappedPasses,
                maxMergesPerPassPercentage,
                uncappedCandidateMerges
            };

            const optimizedChunks = await optimizeAndRebalanceChunks(
                chunkObjects,
                sentenceEmbeddings,
                maxTokenSize,
                combineChunksSimilarityThreshold,
                mergeOptions,
                embedBatch
            );

            // Extract text from chunk objects for downstream processing
            finalChunks = optimizedChunks.map(chunk => chunk.text);

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

        // Pre-compute embeddings for all final chunks in ONE batched model run.
        // (2.x embedded each chunk in its own single-item call here, which cost
        // one model run per chunk whenever the cache missed.)
        const prefixedChunks = finalChunks.map((chunk) => applyPrefixToChunk(chunkPrefix, chunk));
        let chunkEmbeddings = null;
        if (returnEmbedding) {
            chunkEmbeddings = await embedBatch(prefixedChunks);
        }

        return finalChunks.map((chunk, index) => {
            const prefixedChunk = prefixedChunks[index];
            const result = {
                document_id: documentId,
                document_name: documentName,
                number_of_chunks: numberOfChunks,
                chunk_number: index + 1,
                model_name: ctx.modelName,
                dtype: ctx.dtype,
                text: prefixedChunk
            };

            if (returnEmbedding) {
                result.embedding = chunkEmbeddings[index];
            }

            if (returnTokenLength) {
                try {
                    result.token_length = countTokens(prefixedChunk);
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
        });
    }));

    // Flatten the results array since we're processing multiple documents
    return allResults.flat();
}

/**
 * cramit pipeline: sentence split -> greedy token-packed chunks -> assemble.
 * @param {Object} ctx - Embedding context.
 * @param {Array} documents - Document objects with document_text.
 * @param {Object} opts - Per-call options (already defaulted).
 * @returns {Promise<Array>} Flat chunk results across all documents.
 */
export async function runCramit(ctx, documents, opts) {
    const {
        logging,
        maxTokenSize,
        returnEmbedding,
        returnTokenLength,
        chunkPrefix,
        excludeChunkPrefixInResults,
        excludeNonLetterSentences,
    } = opts;

    if (!Array.isArray(documents)) {
        throw new Error('Input must be an array of document objects');
    }

    const embedBatch = labelEmbedErrors(ctx.createScope().embedBatch, 'cramit embedding');
    const countTokens = (text) => ctx.countTokens(text);

    // Process each document
    const allResults = await Promise.all(documents.map(async (doc) => {
        if (!doc.document_text) {
            throw new Error('Each document must have a document_text property');
        }

        // Split the text into sentences
        const sentences = await parseSentences(doc.document_text, { excludeNonLetterSentences });

        // Create chunks without considering similarities
        const chunks = createChunks(sentences, null, maxTokenSize, 0, logging, countTokens);

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

        // Pre-compute embeddings for all chunks if needed (batched for efficiency)
        const prefixedChunks = chunks.map((chunk) => applyPrefixToChunk(chunkPrefix, chunk));
        let chunkEmbeddings = null;
        if (returnEmbedding) {
            chunkEmbeddings = await embedBatch(prefixedChunks);
        }

        return chunks.map((chunk, index) => {
            const prefixedChunk = prefixedChunks[index];
            const result = {
                document_id: documentId,
                document_name: documentName,
                number_of_chunks: numberOfChunks,
                chunk_number: index + 1,
                model_name: ctx.modelName,
                dtype: ctx.dtype,
                text: prefixedChunk
            };

            if (returnEmbedding) {
                result.embedding = chunkEmbeddings[index];
            }

            if (returnTokenLength) {
                try {
                    result.token_length = countTokens(prefixedChunk);
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
        });
    }));

    // Flatten the results array since we're processing multiple documents
    return allResults.flat();
}

/**
 * sentenceit pipeline: sentence split -> assemble (optional embeddings).
 * @param {Object} ctx - Embedding context.
 * @param {Array} documents - Document objects with document_text.
 * @param {Object} opts - Per-call options (already defaulted).
 * @returns {Promise<Array>} Flat sentence results across all documents.
 */
export async function runSentenceit(ctx, documents, opts) {
    const {
        logging,
        returnEmbedding,
        returnTokenLength,
        chunkPrefix,
        excludeChunkPrefixInResults,
        excludeNonLetterSentences,
    } = opts;

    if (!Array.isArray(documents)) {
        throw new Error('Input must be an array of document objects');
    }

    const embedBatch = labelEmbedErrors(ctx.createScope().embedBatch, 'sentenceit embedding');
    const countTokens = (text) => ctx.countTokens(text);

    // Process each document
    const allResults = await Promise.all(documents.map(async (doc) => {
        if (!doc.document_text) {
            throw new Error('Each document must have a document_text property');
        }

        // Split the text into sentences
        const chunks = await parseSentences(doc.document_text, { excludeNonLetterSentences });

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

        // Pre-compute embeddings for all sentences if needed (batched for efficiency)
        const prefixedChunks = chunks.map((chunk) => (chunkPrefix ? applyPrefixToChunk(chunkPrefix, chunk) : chunk));
        let sentenceEmbeddings = null;
        if (returnEmbedding) {
            sentenceEmbeddings = await embedBatch(prefixedChunks);
        }

        return chunks.map((chunk, index) => {
            const prefixedChunk = prefixedChunks[index];
            const result = {
                document_id: documentId,
                document_name: documentName,
                number_of_sentences: numberOfChunks,
                sentence_number: index + 1,
                text: prefixedChunk
            };

            if (returnEmbedding) {
                result.model_name = ctx.modelName;
                result.dtype = ctx.dtype;
                result.embedding = sentenceEmbeddings[index];
            }

            if (returnTokenLength) {
                try {
                    result.token_length = countTokens(prefixedChunk);
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
        });
    }));

    // Flatten the results array since we're processing multiple documents
    return allResults.flat();
}
