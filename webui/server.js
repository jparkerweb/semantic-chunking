import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkit } from '../chunkit.js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packageJson = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION = packageJson.version;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add a new route to serve the version
app.get('/version', (req, res) => {
    res.json({ version: VERSION });
});

// Chunking API endpoint
app.post('/api/chunk', async (req, res) => {
    try {
        const { documentText, documentName, dtype, onnxEmbeddingModelQuantized, ...options } = req.body;
        
        // Convert dtype value to string mapping
        const dtypeValues = ['fp32', 'fp16', 'q8', 'q4'];
        const dtypeString = dtypeValues[parseInt(dtype)] || 'fp32';

        // Process the text with new dtype option
        const documents = [{
            document_name: documentName || 'sample text',
            document_text: documentText
        }];

        const processedOptions = {
            ...options,
            dtype: dtypeString,
            maxTokenSize: parseInt(options.maxTokenSize),
            similarityThreshold: parseFloat(options.similarityThreshold),
            dynamicThresholdLowerBound: parseFloat(options.dynamicThresholdLowerBound),
            dynamicThresholdUpperBound: parseFloat(options.dynamicThresholdUpperBound),
            numSimilaritySentencesLookahead: parseInt(options.numSimilaritySentencesLookahead),
            combineChunks: options.combineChunks === true,
            combineChunksSimilarityThreshold: parseFloat(options.combineChunksSimilarityThreshold),
            returnEmbedding: options.returnEmbedding === true,
            returnTokenLength: options.returnTokenLength === true,
            logging: options.logging === true,
            localModelPath: path.join(__dirname, '../models'),
            modelCacheDir: path.join(__dirname, '../models')
        };

        const result = await chunkit(documents, processedOptions);
        res.json(result);
    } catch (error) {
        console.error('Error processing chunk:', error);
        res.status(500).json({ 
            error: 'Error processing text',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
