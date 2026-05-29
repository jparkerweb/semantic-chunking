// -------------------------
// -- mock-embed.js --
// -------------------------------------------------------------------------------
// Deterministic, network-free mock embedCallback for the characterization tests.
//
// The semantic-chunking embedCallback contract (see embeddingUtils.js:
// wrapCallbackWithCache / validateEmbeddingResult) is:
//   (texts: string[]) => Promise<Array<number[] | Float32Array | Float64Array>>
// returning one numeric vector per input text, in input order, all the same
// length. validateEmbeddingResult enforces: result is an Array, length matches
// the input, each item is an Array/Float32Array/Float64Array, and the first few
// elements are finite numbers.
//
// Vectors are produced from a stable string hash so the same text always maps to
// the same vector on every run and every machine (no Math.random, no clock, no
// network). The vectors are L2-normalized to mimic real embedding output.
// -------------------------------------------------------------------------------

/**
 * Embedding dimensionality of the mock vectors. Matches the all-MiniLM-L6-v2
 * dimension (384) so the mock is a drop-in stand-in for the default model.
 * @type {number}
 */
export const MOCK_EMBEDDING_DIM = 384;

/**
 * Computes a stable 32-bit FNV-1a hash of a string.
 * Deterministic and platform-independent.
 * @param {string} str - Input string.
 * @returns {number} Unsigned 32-bit hash.
 */
function fnv1a(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        // 32-bit FNV prime multiply via shifts to stay in integer range
        hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
    }
    return hash >>> 0;
}

/**
 * Deterministic pseudo-random generator (mulberry32). Seeded by a 32-bit integer.
 * @param {number} seed - 32-bit seed.
 * @returns {function(): number} Function returning floats in [0, 1).
 */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Maps a single text to a stable, L2-normalized embedding vector.
 * @param {string} text - Input text.
 * @param {number} [dim=MOCK_EMBEDDING_DIM] - Vector dimensionality.
 * @returns {number[]} Normalized embedding vector.
 */
export function mockEmbedText(text, dim = MOCK_EMBEDDING_DIM) {
    const rand = mulberry32(fnv1a(text));
    const vec = new Array(dim);
    let sumSq = 0;
    for (let i = 0; i < dim; i++) {
        // Centre on zero so vectors point in varied directions.
        const v = rand() * 2 - 1;
        vec[i] = v;
        sumSq += v * v;
    }
    const magnitude = Math.sqrt(sumSq) || 1;
    for (let i = 0; i < dim; i++) {
        vec[i] = vec[i] / magnitude;
    }
    return vec;
}

/**
 * Deterministic mock embedCallback. Satisfies the embedCallback contract used by
 * chunkit/cramit/sentenceit: accepts an array of texts and returns an array of
 * equal-length numeric vectors, one per text, in input order.
 * @param {string[]} texts - Texts to embed.
 * @returns {Promise<number[][]>} One normalized vector per input text.
 */
export async function mockEmbedCallback(texts) {
    return texts.map((text) => mockEmbedText(text));
}
