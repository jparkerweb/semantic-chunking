<<<<<<< HEAD
import { cramit } from './chunkit.js';
=======
>>>>>>> ff0fd4004c2e624f039840a3f3b10b624dac375c
import { chunkit } from './chunkit.js';
import fs from 'fs';

const fp = process.argv[2];
const text = await fs.promises.readFile(fp, 'utf8');

// start timing
const startTime = performance.now();

const opts = {

    v1: {
        logging: true,
        maxTokenSize: 1000,
        similarityThreshold: .20,             // higher value requires higher similarity to be included (less inclusive)
        dynamicThresholdLowerBound: .20,      // lower bound for dynamic threshold
        dynamicThresholdUpperBound: 1,        // upper bound for dynamic threshold
        numSimilaritySentencesLookahead: 5,
        combineChunks: true,
        combineChunksSimilarityThreshold: 0.2, // lower value will combine more chunks (more inclusive)
        onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
        onnxEmbeddingModelQuantized: true,
    },
    // v2: {
    //     logging: true,
    //     maxTokenSize: 800,
    //     similarityThreshold: .5,             // higher value requires higher similarity to be included (less inclusive)
    //     dynamicThresholdLowerBound: .4,        // lower bound for dynamic threshold
    //     dynamicThresholdUpperBound: .8,        // upper bound for dynamic threshold
    //     numSimilaritySentencesLookahead: 3,
    //     combineChunks: false,
    //     combineChunksSimilarityThreshold: 0.5, // lower value will combine more chunks (more inclusive)
    //     onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
    //     onnxEmbeddingModelQuantized: true,
    // },
    // v3: {
    //     logging: true,
    //     maxTokenSize: 800,
    //     similarityThreshold: .75,             // higher value requires higher similarity to be included (less inclusive)
    //     dynamicThresholdLowerBound: .2,        // lower bound for dynamic threshold
    //     dynamicThresholdUpperBound: .9,        // upper bound for dynamic threshold
    //     numSimilaritySentencesLookahead: 3,
    //     combineChunks: false,
    //     combineChunksSimilarityThreshold: 0.75, // lower value will combine more chunks (more inclusive)
    //     onnxEmbeddingModel: "Xenova/all-MiniLM-L6-v2",
    //     onnxEmbeddingModelQuantized: true,
    // },

}


async function main() {

    const keyList = Object.keys(opts);

    for (const key of keyList) {

        const config = opts[key];
        console.log("config", { key, config });

        let chunks = await chunkit(
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
        const desc = `${key}-size-${config.maxTokenSize}.sim-${config.similarityThreshold}.comb-${config.combineChunksSimilarityThreshold}.dyn-${config.dynamicThresholdLowerBound}-${config.dynamicThresholdUpperBound}`
        const outfile = fp.replace('.txt', `.${desc}.chunks.json`);
        const output = {
            config,
            count: chunks.length,
            trackedTimeSeconds,
            chunks,
        }

        fs.promises.writeFile(outfile, JSON.stringify(output, null, 2));

        chunks.map(chunk => {
            console.log(chunk, '\n----\n');
        })

        console.log("results", {
            chunks: chunks.length,
            trackedTimeSeconds,
            config,
            outfile
        })

    }

    console.log("done");
    process.exit(0);

}


await main()
