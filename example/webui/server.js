import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkit } from '../../chunkit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chunking API endpoint
app.post('/api/chunk', async (req, res) => {
    try {
        const { documentText, documentName, ...options } = req.body;

        // Input validation
        if (!documentText) {
            return res.status(400).json({ error: 'Document text is required' });
        }

        // Convert string values to appropriate types
        const processedOptions = {
            ...options,
            maxTokenSize: parseInt(options.maxTokenSize),
            similarityThreshold: parseFloat(options.similarityThreshold),
            dynamicThresholdLowerBound: parseFloat(options.dynamicThresholdLowerBound),
            dynamicThresholdUpperBound: parseFloat(options.dynamicThresholdUpperBound),
            numSimilaritySentencesLookahead: parseInt(options.numSimilaritySentencesLookahead),
            combineChunks: options.combineChunks === true,
            combineChunksSimilarityThreshold: parseFloat(options.combineChunksSimilarityThreshold),
            onnxEmbeddingModelQuantized: options.onnxEmbeddingModelQuantized === true,
            returnEmbedding: options.returnEmbedding === true,
            returnTokenLength: options.returnTokenLength === true,
            logging: options.logging === true,
            localModelPath: path.join(__dirname, 'models'),
            modelCacheDir: path.join(__dirname, 'models')
        };

        // Process the text
        const documents = [{
            document_name: documentName || 'sample text',
            document_text: documentText
        }];
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
