// -------------------------
// -- characterization.test.js --
// -------------------------------------------------------------------------------
// Characterization (golden-output) baseline for chunkit / cramit / sentenceit.
//
// This locks the OUTPUT of the three public functions on a fixed set of fixture
// documents so any later refactor (delegating embedding / tokenizer / similarity
// to embedding-utils) can be checked for behavior drift. It is the source of
// truth for "no behavior drift."
//
// Two passes per function, per document:
//   (a) mock   - deterministic offline embedCallback (mock-embed.js). Fully
//                reproducible across runs and machines; no network.
//   (b) onnx   - the default ONNX model (Xenova/all-MiniLM-L6-v2, q8, cpu,
//                ./models) with returnTokenLength:true, returnEmbedding:false,
//                to lock token-count parity. Skipped (not failed) only when the
//                model is neither cached locally nor reachable over the network.
//
// Golden files live in tests/fixtures/golden/*.json. First run writes them when
// absent; every subsequent run compares against the committed golden. Re-running
// after the refactor re-validates against these exact files.
// -------------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import https from 'node:https';

import { chunkit, cramit, sentenceit } from '../chunkit.js';
import { sampleDocs } from './fixtures/sample-docs.js';
import { mockEmbedCallback } from './helpers/mock-embed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const GOLDEN_DIR = resolve(__dirname, 'fixtures', 'golden');
const MODELS_DIR = resolve(__dirname, '..', 'models');

// Default ONNX config used for the (b) pass. Mirrors the repo defaults.
const ONNX_OPTS = {
    onnxEmbeddingModel: 'Xenova/all-MiniLM-L6-v2',
    dtype: 'q8',
    device: 'cpu',
    localModelPath: './models',
    modelCacheDir: './models',
    returnTokenLength: true,
    returnEmbedding: false,
};

// --------------------------------------------
// -- Golden serialization / comparison utils --
// --------------------------------------------

if (!existsSync(GOLDEN_DIR)) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
}

/**
 * Reduces a chunkit/cramit result array to the stable, comparable shape we lock:
 * counts, ordering, text, token_length (when present) and derived character
 * boundaries (cumulative length of each chunk's text). Volatile fields
 * (document_id timestamp) are intentionally excluded.
 * @param {object[]} results - Raw function output.
 * @returns {object} Normalized golden record.
 */
function normalizeChunks(results) {
    let cursor = 0;
    const items = results.map((r) => {
        const start = cursor;
        const end = cursor + r.text.length;
        cursor = end;
        const item = {
            chunk_number: r.chunk_number,
            number_of_chunks: r.number_of_chunks,
            text: r.text,
            boundary: { start, end },
        };
        if (Object.prototype.hasOwnProperty.call(r, 'token_length')) {
            item.token_length = r.token_length;
        }
        return item;
    });
    return { count: results.length, items };
}

/**
 * Reduces a sentenceit result array to the stable comparable shape.
 * @param {object[]} results - Raw sentenceit output.
 * @returns {object} Normalized golden record.
 */
function normalizeSentences(results) {
    let cursor = 0;
    const items = results.map((r) => {
        const start = cursor;
        const end = cursor + r.text.length;
        cursor = end;
        const item = {
            sentence_number: r.sentence_number,
            number_of_sentences: r.number_of_sentences,
            text: r.text,
            boundary: { start, end },
        };
        if (Object.prototype.hasOwnProperty.call(r, 'token_length')) {
            item.token_length = r.token_length;
        }
        return item;
    });
    return { count: results.length, items };
}

/**
 * Writes golden when absent (first run) or asserts deep equality against the
 * committed golden (subsequent runs).
 * @param {string} name - Golden filename stem.
 * @param {object} actual - Normalized record to lock / compare.
 * @returns {{ wrote: boolean, count: number }} Whether golden was written and item count.
 */
function lockOrCompareGolden(name, actual) {
    const file = resolve(GOLDEN_DIR, `${name}.json`);
    if (!existsSync(file)) {
        writeFileSync(file, JSON.stringify(actual, null, 2) + '\n', 'utf8');
        return { wrote: true, count: actual.count };
    }
    const expected = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(actual, expected, `golden drift detected for ${name}.json`);
    return { wrote: false, count: actual.count };
}

// ------------------------------------------------
// -- Decide whether the ONNX pass can run safely --
// ------------------------------------------------

/**
 * @returns {boolean} True if any ONNX model file appears cached under ./models.
 */
function hasCachedModel() {
    if (!existsSync(MODELS_DIR)) return false;
    const stack = [MODELS_DIR];
    while (stack.length) {
        const dir = stack.pop();
        let entries;
        try {
            entries = readdirSync(dir, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const e of entries) {
            const full = resolve(dir, e.name);
            if (e.isDirectory()) {
                stack.push(full);
            } else if (e.name.endsWith('.onnx')) {
                return true;
            }
        }
    }
    return false;
}

/**
 * @returns {Promise<boolean>} True if huggingface.co responds (network available).
 */
function hasNetwork() {
    return new Promise((res) => {
        const req = https.request(
            { method: 'HEAD', host: 'huggingface.co', path: '/', timeout: 8000 },
            (response) => {
                response.resume();
                res(response.statusCode > 0);
            }
        );
        req.on('error', () => res(false));
        req.on('timeout', () => {
            req.destroy();
            res(false);
        });
        req.end();
    });
}

// -----------------------
// -- Mock-pass tests (a) --
// -----------------------

const FUNCS = { chunkit, cramit };

for (const doc of sampleDocs) {
    for (const [fnName, fn] of Object.entries(FUNCS)) {
        test(`mock | ${fnName} | ${doc.name}`, async () => {
            const results = await fn(
                [{ document_name: doc.document_name, document_text: doc.document_text }],
                {
                    returnTokenLength: true,
                    returnEmbedding: false,
                    embedCallback: mockEmbedCallback,
                }
            );
            const golden = normalizeChunks(results);
            const { wrote, count } = lockOrCompareGolden(`${fnName}.mock.${doc.name}`, golden);
            assert.ok(count >= 1, 'expected at least one chunk');
            console.log(`[golden] ${fnName}.mock.${doc.name}: ${count} chunks (${wrote ? 'wrote' : 'compared'})`);
        });
    }

    test(`mock | sentenceit | ${doc.name}`, async () => {
        const results = await sentenceit(
            [{ document_name: doc.document_name, document_text: doc.document_text }],
            {
                returnTokenLength: true,
                returnEmbedding: false,
                embedCallback: mockEmbedCallback,
            }
        );
        const golden = normalizeSentences(results);
        const { wrote, count } = lockOrCompareGolden(`sentenceit.mock.${doc.name}`, golden);
        assert.ok(count >= 1, 'expected at least one sentence');
        console.log(`[golden] sentenceit.mock.${doc.name}: ${count} sentences (${wrote ? 'wrote' : 'compared'})`);
    });
}

// -----------------------
// -- ONNX-pass tests (b) --
// -----------------------

const cachedModel = hasCachedModel();
let networkAvailable = false;
let onnxSkipReason = '';

test('onnx availability probe', async () => {
    if (cachedModel) {
        networkAvailable = false; // not needed
        console.log('[onnx] cached model found under ./models');
    } else {
        networkAvailable = await hasNetwork();
        console.log(`[onnx] no cached model; network reachable: ${networkAvailable}`);
    }
    if (!cachedModel && !networkAvailable) {
        onnxSkipReason = 'no cached ONNX model under ./models and huggingface.co unreachable';
    }
});

for (const doc of sampleDocs) {
    for (const [fnName, fn] of Object.entries(FUNCS)) {
        test(`onnx | ${fnName} | ${doc.name}`, { timeout: 600000 }, async (t) => {
            if (!cachedModel && !networkAvailable) {
                t.skip(`ONNX pass skipped: ${onnxSkipReason}`);
                return;
            }
            const results = await fn(
                [{ document_name: doc.document_name, document_text: doc.document_text }],
                { ...ONNX_OPTS }
            );
            const golden = normalizeChunks(results);
            const { wrote, count } = lockOrCompareGolden(`${fnName}.onnx.${doc.name}`, golden);
            assert.ok(count >= 1, 'expected at least one chunk');
            console.log(`[golden] ${fnName}.onnx.${doc.name}: ${count} chunks (${wrote ? 'wrote' : 'compared'})`);
        });
    }

    test(`onnx | sentenceit | ${doc.name}`, { timeout: 600000 }, async (t) => {
        if (!cachedModel && !networkAvailable) {
            t.skip(`ONNX pass skipped: ${onnxSkipReason}`);
            return;
        }
        const results = await sentenceit(
            [{ document_name: doc.document_name, document_text: doc.document_text }],
            { ...ONNX_OPTS }
        );
        const golden = normalizeSentences(results);
        const { wrote, count } = lockOrCompareGolden(`sentenceit.onnx.${doc.name}`, golden);
        assert.ok(count >= 1, 'expected at least one sentence');
        console.log(`[golden] sentenceit.onnx.${doc.name}: ${count} sentences (${wrote ? 'wrote' : 'compared'})`);
    });
}
