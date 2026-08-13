// -------------------------
// -- chunker.test.js --
// -------------------------------------------------------------------------------
// v3 instance API (`createChunker`) behavior tests. All offline: the mock
// embedCallback from mock-embed.js stands in for the model, and the tokenizer
// loads from ./models (same as the characterization suite).
//
// Covers:
//   - parity: instance API output equals the legacy chunkit() shim output
//   - cache modes: 'request' (no cross-call retention), 'instance'
//     (cross-call retention), false (no caching + batched final pass)
//   - batched final chunk-embedding pass (no single-item model calls)
//   - modelName/dtypeLabel identity overrides for the embedCallback path
//   - invalid cache mode rejection
//   - concurrent chunkers with different callbacks do not cross-contaminate
// -------------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chunkit, createChunker } from '../chunkit.js';
import { sampleDocs } from './fixtures/sample-docs.js';
import { mockEmbedCallback, mockEmbedText } from './helpers/mock-embed.js';

const doc = sampleDocs.find((d) => d.name === 'multiparagraph') ?? sampleDocs[0];
const documents = () => [{ document_name: doc.document_name, document_text: doc.document_text }];

const CALL_OPTS = { returnTokenLength: true, returnEmbedding: false };

/** Strips volatile fields for comparison. */
function comparable(results) {
    return results.map(({ document_id, ...rest }) => rest);
}

/** Wraps the mock callback with invocation recording. */
function recordingCallback() {
    const calls = [];
    const callback = async (texts) => {
        calls.push(texts.slice());
        return mockEmbedCallback(texts);
    };
    return { callback, calls };
}

test('instance API output equals legacy chunkit() shim output', async () => {
    const legacy = await chunkit(documents(), { ...CALL_OPTS, embedCallback: mockEmbedCallback });

    const chunker = createChunker({ embedCallback: mockEmbedCallback });
    const instance = await chunker.chunkit(documents(), CALL_OPTS);

    assert.deepEqual(comparable(instance), comparable(legacy));
});

test("cache: 'request' (default) retains nothing across calls", async () => {
    const { callback, calls } = recordingCallback();
    const chunker = createChunker({ embedCallback: callback });

    await chunker.chunkit(documents(), CALL_OPTS);
    const callsAfterFirst = calls.length;
    assert.ok(callsAfterFirst >= 1, 'first call must embed');

    await chunker.chunkit(documents(), CALL_OPTS);
    assert.ok(
        calls.length > callsAfterFirst,
        'second call must re-embed: request-scoped cache must not persist across calls'
    );
});

test("cache: 'instance' reuses embeddings across calls on the same chunker", async () => {
    const { callback, calls } = recordingCallback();
    const chunker = createChunker({ embedCallback: callback, cache: 'instance' });

    const first = await chunker.chunkit(documents(), CALL_OPTS);
    const callsAfterFirst = calls.length;

    const second = await chunker.chunkit(documents(), CALL_OPTS);
    assert.equal(
        calls.length,
        callsAfterFirst,
        'second identical call must be served entirely from the instance cache'
    );
    assert.deepEqual(comparable(second), comparable(first));
});

test("cache: false batches the final chunk-embedding pass (no single-item model calls)", async () => {
    const { callback, calls } = recordingCallback();
    const chunker = createChunker({ embedCallback: callback, cache: false });

    const results = await chunker.chunkit(documents(), {
        returnTokenLength: false,
        returnEmbedding: true,
    });
    assert.ok(results.length > 1, 'need a multi-chunk document for this test');

    // 2.x embedded each final chunk in its own single-item call. v3 must issue
    // one batched call carrying every final chunk text.
    const finalTexts = results.map((r) => r.text);
    const hasBatchedFinalPass = calls.some(
        (batch) => batch.length === finalTexts.length && finalTexts.every((t) => batch.includes(t))
    );
    assert.ok(hasBatchedFinalPass, 'expected one batched call containing all final chunk texts');

    const singleItemCalls = calls.filter((batch) => batch.length === 1);
    assert.equal(singleItemCalls.length, 0, 'expected no single-item embedding calls');

    // And the embeddings must match the mock's per-text vectors exactly.
    for (const r of results) {
        assert.deepEqual(Array.from(r.embedding), mockEmbedText(r.text));
    }
});

test('embedCallback path defaults to custom-embedding identity (legacy parity)', async () => {
    const chunker = createChunker({ embedCallback: mockEmbedCallback });
    const results = await chunker.chunkit(documents(), CALL_OPTS);

    assert.equal(results[0].model_name, 'custom-embedding');
    assert.equal(results[0].dtype, 'custom');
});

test('modelName/dtypeLabel overrides are reported for the embedCallback path', async () => {
    const chunker = createChunker({
        embedCallback: mockEmbedCallback,
        modelName: 'acme/private-encoder-v2',
        dtypeLabel: 'fp32',
    });
    const results = await chunker.chunkit(documents(), CALL_OPTS);

    assert.equal(results[0].model_name, 'acme/private-encoder-v2');
    assert.equal(results[0].dtype, 'fp32');
    assert.equal(chunker.modelName, 'acme/private-encoder-v2');
    assert.equal(chunker.dtype, 'fp32');
});

test('invalid cache mode throws at construction', () => {
    assert.throws(
        () => createChunker({ embedCallback: mockEmbedCallback, cache: 'process' }),
        /Invalid cache mode/
    );
});

test('warmup() on the embedCallback path loads the tokenizer without embedding', async () => {
    const { callback, calls } = recordingCallback();
    const chunker = createChunker({ embedCallback: callback });

    await chunker.warmup();
    assert.equal(calls.length, 0, 'warmup must not invoke the embedCallback');

    // Tokenizer is usable immediately after warmup via a real call.
    const results = await chunker.chunkit(documents(), CALL_OPTS);
    assert.ok(results.every((r) => Number.isInteger(r.token_length) && r.token_length > 0));
});

test('concurrent chunkers with different callbacks do not cross-contaminate', async () => {
    // Two callbacks producing DIFFERENT vectors for the same text. Under the
    // 2.x module-global provider/cache this raced; v3 must keep them isolated
    // even when the calls interleave.
    const flat = async (texts) => texts.map(() => new Array(8).fill(0.5));
    const spiky = async (texts) =>
        texts.map((_, i) => {
            const v = new Array(8).fill(0.001);
            v[i % 8] = 1;
            return v;
        });

    const a = createChunker({ embedCallback: flat, cache: 'instance' });
    const b = createChunker({ embedCallback: spiky, cache: 'instance' });

    const [resA, resB] = await Promise.all([
        a.chunkit(documents(), { returnEmbedding: true, returnTokenLength: false }),
        b.chunkit(documents(), { returnEmbedding: true, returnTokenLength: false }),
    ]);

    assert.ok(resA.every((r) => r.embedding.every((x) => x === 0.5)), 'chunker A vectors leaked');
    assert.ok(resB.every((r) => r.embedding.some((x) => x === 1)), 'chunker B vectors leaked');
});

test('dispose() clears the instance cache so the next call re-embeds', async () => {
    const { callback, calls } = recordingCallback();
    const chunker = createChunker({ embedCallback: callback, cache: 'instance' });

    await chunker.chunkit(documents(), CALL_OPTS);
    const callsAfterFirst = calls.length;

    chunker.dispose();

    await chunker.chunkit(documents(), CALL_OPTS);
    assert.ok(calls.length > callsAfterFirst, 'post-dispose call must re-embed');
});
