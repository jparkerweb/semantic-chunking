import { createEmbedding } from './embeddingUtils.js';

// -----------------------------------------------------
// -- Calculate cosine similarity between two vectors --
// -----------------------------------------------------
export function cosineSimilarity(vecA, vecB) {
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

// ---------------------------------------------------------------
// -- Function to compute advanced similarities with statistics --
// ---------------------------------------------------------------
export async function computeAdvancedSimilarities(sentences, { numSimilaritySentencesLookahead = 2, logging = false } = {}) {
    if (logging) console.log('numSimilaritySentencesLookahead', numSimilaritySentencesLookahead);

    const embeddings = await Promise.all(sentences.map(sentence => createEmbedding(sentence)));
    let similarities = [];
    let similaritySum = 0;

    for (let i = 0; i < embeddings.length - 1; i++) {
        let maxSimilarity = cosineSimilarity(embeddings[i], embeddings[i + 1]);

        if (logging) {
            console.log(`\nSimilarity scores for sentence ${i}:`);
            console.log(`Base similarity with next sentence: ${maxSimilarity}`);
        }

        for (let j = i + 2; j <= i + numSimilaritySentencesLookahead && j < embeddings.length; j++) {
            const sim = cosineSimilarity(embeddings[i], embeddings[j]);
            if (logging) {
                console.log(`Similarity with sentence ${j}: ${sim}`);
            }
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
export function adjustThreshold(average, variance, baseThreshold = 0.5, lowerBound = 0.2, upperBound = 0.8) {
    if (lowerBound >= upperBound) {
        console.error("Invalid bounds: lowerBound must be less than upperBound.");
        return baseThreshold;
    }

    let adjustedThreshold = baseThreshold;
    if (variance < 0.01) {
        adjustedThreshold -= 0.1;
    } else if (variance > 0.05) {
        adjustedThreshold += 0.1;
    }

    if (average < 0.3) {
        adjustedThreshold += 0.05;
    } else if (average > 0.7) {
        adjustedThreshold -= 0.05;
    }

    return Math.min(Math.max(adjustedThreshold, lowerBound), upperBound);
}