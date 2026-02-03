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
    device: 'cpu',
    returnEmbedding: false,
    returnTokenLength: true,
    chunkPrefix: null,
    excludeChunkPrefixInResults: false,
    maxMergesPerPass: 500,
    maxUncappedPasses: 100,
    maxMergesPerPassPercentage: 40,
    uncappedCandidateMerges: 12,
};

export default defaultFormValues;