export const DEFAULT_CONFIG = {
    LOGGING: false,
    MAX_TOKEN_SIZE: 500,
    SIMILARITY_THRESHOLD: 0.456,
    DYNAMIC_THRESHOLD_LOWER_BOUND: 0.2,
    DYNAMIC_THRESHOLD_UPPER_BOUND: 0.8,
    NUM_SIMILARITY_SENTENCES_LOOKAHEAD: 2,
    COMBINE_CHUNKS: true,
    COMBINE_CHUNKS_SIMILARITY_THRESHOLD: 0.4,
    ONNX_EMBEDDING_MODEL: "Xenova/all-MiniLM-L6-v2",
    ONNX_EMBEDDING_MODEL_QUANTIZED: true,
    LOCAL_MODEL_PATH: null,
    MODEL_CACHE_DIR: null,
    RETURN_EMBEDDING: false,
    RETURN_TOKEN_LENGTH: false,
    CHUNK_PREFIX: null,
};