import { cramit } from './chunkit.js';
import fs from 'fs';

const fp = process.argv[2];
const text = await fs.promises.readFile(fp, 'utf8');

// start timing
const startTime = performance.now();

const opts = {
    v1: {
        logging: true,
        maxTokenSize: 300,
        similarityThreshold: .577,             // higher value requires higher similarity to be included (less inclusive)
        dynamicThresholdLowerBound: .2,        // lower bound for dynamic threshold
        dynamicThresholdUpperBound: .9,        // upper bound for dynamic threshold
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.3, // lower value will combine more chunks (more inclusive)
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
    },
    v2: {
        logging: true,
        maxTokenSize: 300,
        similarityThreshold: .577,             // higher value requires higher similarity to be included (less inclusive)
        dynamicThresholdLowerBound: .2,        // lower bound for dynamic threshold
        dynamicThresholdUpperBound: .9,        // upper bound for dynamic threshold
        numSimilaritySentencesLookahead: 3,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.3, // lower value will combine more chunks (more inclusive)
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
    },
    v3: {
        logging: false,
        maxTokenSize: 1000,
        dynamicThresholdLowerBound: .2,        // lower bound for dynamic threshold
        dynamicThresholdUpperBound: .8,        // upper bound for dynamic threshold
        similarityThreshold: .80,             // higher value requires higher similarity to be included (less inclusive)
        numSimilaritySentencesLookahead: 5,
        combineChunksSimilarityThreshold: 0.6, // lower value will combine more chunks (more inclusive)
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: false,
    }
}


async function main() {

    const config = opts.v3;

    let chunks = await cramit(
        text,
        config
    );

    // end timeing
    const endTime = performance.now();

    // calculate tracked time in seconds
    let trackedTimeSeconds = (endTime - startTime) / 1000;
    trackedTimeSeconds = parseFloat(trackedTimeSeconds.toFixed(2));

    console.log("\n\n\n");
    // console.log("myTestChunks:");
    // console.log(myTestChunks);
    const desc = `size-${config.maxTokenSize}.sim-${config.similarityThreshold}.comb-${config.combineChunksSimilarityThreshold}.dyn-${config.dynamicThresholdLowerBound}-${config.dynamicThresholdUpperBound}`
    const outfile = fp.replace('.txt', `.${desc}.chunks.json`);
    const output = {
        chunks,
        count: chunks.length,
        trackedTimeSeconds,
        config,
    }

    fs.promises.writeFile(outfile, JSON.stringify(output, null, 2));

    chunks.map(chunk => {
        console.log(chunk, '\n----\n');
    })

    console.log("results", {
        chunks: chunks.length,
        trackedTimeSeconds,
        config
    })

    // console.log(chunks);

}


main()
