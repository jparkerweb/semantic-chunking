import { pipeline, env as transformerCache } from "@xenova/transformers"
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

for (const model of downloadModelsList.models) {
    console.log(`model: ${model.modelName}, quantized: ${model.quantized}`)
    bar.start(100, 0, { model: model.modelName})
    
    await pipeline("feature-extraction", model.modelName, {
        quantized: model.quantized,
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