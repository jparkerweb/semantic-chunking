import { pipeline, env as transformerCache } from "@xenova/transformers"
import cliProgress from "cli-progress"
import fs from "fs/promises"

const data = await fs.readFile('./tools/download-models-list.json', 'utf8');
const downloadModelsList = JSON.parse(data);


transformerCache.cacheDir = "models"

console.log(`Downloading embedding models…`)

const bar = new cliProgress.SingleBar({
	clearOnComplete: false,
	hideCursor: true,
	format: "[{bar}] {value}% | {model}",
})


let started = false

for (const model of downloadModelsList) {
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