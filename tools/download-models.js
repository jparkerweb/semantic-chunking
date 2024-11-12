import { pipeline, env as transformerCache } from "@huggingface/transformers"
import cliProgress from "cli-progress"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Update the file path to be relative to the script's location
const dataFilePath = path.join(__dirname, 'download-models-list.json')
const data = await fs.readFile(dataFilePath, 'utf8');
const downloadModelsList = JSON.parse(data);

// Update the cache directory to be at the root of the project
transformerCache.cacheDir = path.join(__dirname, '..', downloadModelsList.downloadLocation)

console.log(`Downloading embedding models…`)

const bar = new cliProgress.SingleBar({
	clearOnComplete: false,
	hideCursor: true,
	format: "[{bar}] {value}% | {model}",
})

let started = false

const flattenedModels = downloadModelsList.models.flatMap(model => model.dtype.map(dtype => ({ ...model, dtype })));

for (const model of flattenedModels) {
    console.log(`model: ${model.modelName}, dtype: ${model.dtype}`)
    bar.start(100, 0, { model: model.modelName})
    
    await pipeline("feature-extraction", model.modelName, {
        dtype: model.dtype,
        progress_callback: (data) => {
            started = started || data.status === "download"
            if (!started) return
    
            if (data.progress) bar.update(Math.floor(data.progress))
        },
    })
    bar.update(100)
    bar.stop()
}

console.log("Success!")