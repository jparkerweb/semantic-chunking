const defaultFormValues = {
    maxTokenSize: 500,
    similarityThreshold: 0.5,
    dynamicThresholdLowerBound: 0.4,
    dynamicThresholdUpperBound: 0.8,
    numSimilaritySentencesLookahead: 3,
    combineChunks: true,
    combineChunksSimilarityThreshold: 0.5,
    onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
    dtype: 'q8',
    returnEmbedding: false,
    returnTokenLength: true,
    chunkPrefix: null,
    excludeChunkPrefixInResults: false,
};

export default defaultFormValues;