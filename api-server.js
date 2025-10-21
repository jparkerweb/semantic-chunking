import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { chunkit, cramit, sentenceit } from './chunkit.js';

dotenv.config();

// Read package.json for version
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const VERSION = packageJson.version;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth middleware for API routes
const authMiddleware = (req, res, next) => {
    // Only apply auth if API_AUTH_TOKEN is set
    if (API_AUTH_TOKEN) {
        const authHeader = req.headers.authorization;

        if (!authHeader || authHeader !== `Bearer ${API_AUTH_TOKEN}`) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or missing authorization token'
            });
        }
    }
    next();
};

// Landing page with terminal-style docs
app.get('/', (req, res) => {
    const landingPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Semantic Chunking API v${VERSION}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #0a0a0a;
            color: #00ff00;
            font-family: 'Courier New', Courier, monospace;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1, h2, h3 {
            color: #00ff00;
            margin: 20px 0 10px 0;
            text-shadow: 0 0 10px #00ff00;
        }
        h1 {
            font-size: 2em;
            border-bottom: 2px solid #00ff00;
            padding-bottom: 10px;
        }
        h2 {
            font-size: 1.5em;
            margin-top: 30px;
        }
        h3 {
            font-size: 1.2em;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        code {
            background: #1a1a1a;
            padding: 2px 6px;
            border-radius: 3px;
            color: #00ff00;
        }
        pre {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border: 1px solid #00ff00;
            margin: 10px 0;
        }
        pre code {
            background: none;
            padding: 0;
        }
        .endpoint {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #00ff00;
            border-radius: 5px;
            background: #0f0f0f;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            background: #00ff00;
            color: #0a0a0a;
            font-weight: bold;
            border-radius: 3px;
            margin-right: 10px;
        }
        .route {
            color: #00ff00;
            font-weight: bold;
        }
        a {
            color: #00ff00;
            text-decoration: none;
            border-bottom: 1px dashed #00ff00;
        }
        a:hover {
            text-shadow: 0 0 5px #00ff00;
        }
        .info-box {
            background: #1a1a1a;
            border-left: 4px solid #00ff00;
            padding: 15px;
            margin: 20px 0;
        }
        .status {
            color: ${API_AUTH_TOKEN ? '#ffff00' : '#00ff00'};
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            h1 {
                font-size: 1.5em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍱 Semantic Chunking API</h1>
            <p>Version ${VERSION} | <a href="https://github.com/jparkerweb/semantic-chunking" target="_blank">GitHub</a> | <a href="https://www.npmjs.com/package/semantic-chunking" target="_blank">NPM</a></p>
        </div>

        <div class="info-box">
            <strong>Status:</strong> <span class="status">● ${API_AUTH_TOKEN ? 'PROTECTED (Auth Required)' : 'OPEN ACCESS'}</span><br>
            <strong>Port:</strong> ${PORT}<br>
            <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}
        </div>

        <h2>📚 Documentation</h2>
        <p>For complete documentation, see:</p>
        <ul>
            <li><a href="https://github.com/jparkerweb/semantic-chunking/blob/main/API.md" target="_blank">API.md</a> - Full API reference</li>
            <li><a href="https://github.com/jparkerweb/semantic-chunking/blob/main/README.md" target="_blank">README.md</a> - Package documentation</li>
        </ul>

        <h2>📡 API Endpoints</h2>
        <div class="endpoint">
            <span class="method">POST</span><span class="route">/api/chunkit</span>
            <p>Semantically chunk text based on sentence similarity.</p>
            <pre><code>curl -X POST http://localhost:${PORT}/api/chunkit \\
  -H "Content-Type: application/json" \\${API_AUTH_TOKEN ? `\n  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\` : ''}
  -d '{
    "documents": [
      {
        "document_name": "test",
        "document_text": "Your text here..."
      }
    ],
    "options": {
      "maxTokenSize": 500,
      "similarityThreshold": 0.5,
      "onnxEmbeddingModel": "Xenova/all-MiniLM-L6-v2",
      "dtype": "q8"
    }
  }'</code></pre>
        </div>

        <div class="endpoint">
            <span class="method">POST</span><span class="route">/api/cramit</span>
            <p>Pack sentences into dense chunks up to max token size.</p>
            <pre><code>curl -X POST http://localhost:${PORT}/api/cramit \\
  -H "Content-Type: application/json" \\${API_AUTH_TOKEN ? `\n  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\` : ''}
  -d '{
    "documents": [{"document_text": "Your text here..."}],
    "options": {"maxTokenSize": 500}
  }'</code></pre>
        </div>

        <div class="endpoint">
            <span class="method">POST</span><span class="route">/api/sentenceit</span>
            <p>Split text into individual sentences.</p>
            <pre><code>curl -X POST http://localhost:${PORT}/api/sentenceit \\
  -H "Content-Type: application/json" \\${API_AUTH_TOKEN ? `\n  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\` : ''}
  -d '{
    "documents": [{"document_text": "Your text here..."}],
    "options": {}
  }'</code></pre>
        </div>

        <div class="endpoint">
            <span class="method">GET</span><span class="route">/api/health</span>
            <p>Health check endpoint.</p>
            <pre><code>curl http://localhost:${PORT}/api/health</code></pre>
        </div>

        <div class="endpoint">
            <span class="method">GET</span><span class="route">/api/version</span>
            <p>Get API version information.</p>
            <pre><code>curl http://localhost:${PORT}/api/version</code></pre>
        </div>

        <h2>🔐 Authentication</h2>
        ${API_AUTH_TOKEN ? `
        <div class="info-box">
            <p><strong>⚠️ Authentication is ENABLED</strong></p>
            <p>All API endpoints require a Bearer token in the Authorization header:</p>
            <pre><code>Authorization: Bearer YOUR_TOKEN_HERE</code></pre>
        </div>
        ` : `
        <div class="info-box">
            <p><strong>✓ Authentication is DISABLED</strong></p>
            <p>To enable authentication, set the <code>API_AUTH_TOKEN</code> environment variable:</p>
            <pre><code>export API_AUTH_TOKEN=your-secret-token
# or in docker-compose.yml:
environment:
  - API_AUTH_TOKEN=your-secret-token</code></pre>
        </div>
        `}

        <h2>🐳 Docker Deployment</h2>
        <pre><code># Using docker-compose (recommended)
docker-compose up -d semantic-chunking-api

# Or with docker run
docker run -p ${PORT}:${PORT} \\
  -v ./models:/app/models \\
  -e API_AUTH_TOKEN=your-token \\
  semantic-chunking</code></pre>

        <footer style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #00ff00; text-align: center; opacity: 0.7;">
            <p>Maintained by <a href="https://www.equilllabs.com" target="_blank">eQuill Labs</a></p>
        </footer>
    </div>
</body>
</html>`;
    res.send(landingPage);
});

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: VERSION,
        timestamp: new Date().toISOString()
    });
});

// Version endpoint (no auth required)
app.get('/api/version', (req, res) => {
    res.json({
        version: VERSION,
        package: 'semantic-chunking'
    });
});

// Apply auth middleware to all /api/* routes except health and version
app.use('/api/chunkit', authMiddleware);
app.use('/api/cramit', authMiddleware);
app.use('/api/sentenceit', authMiddleware);

// Chunkit endpoint
app.post('/api/chunkit', async (req, res) => {
    try {
        const { documents, options = {} } = req.body;

        if (!documents || !Array.isArray(documents)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Request body must include a "documents" array'
            });
        }

        // Set default model paths
        const processedOptions = {
            ...options,
            localModelPath: options.localModelPath || './models',
            modelCacheDir: options.modelCacheDir || './models'
        };

        const result = await chunkit(documents, processedOptions);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/chunkit:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Cramit endpoint
app.post('/api/cramit', async (req, res) => {
    try {
        const { documents, options = {} } = req.body;

        if (!documents || !Array.isArray(documents)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Request body must include a "documents" array'
            });
        }

        const processedOptions = {
            ...options,
            localModelPath: options.localModelPath || './models',
            modelCacheDir: options.modelCacheDir || './models'
        };

        const result = await cramit(documents, processedOptions);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/cramit:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Sentenceit endpoint
app.post('/api/sentenceit', async (req, res) => {
    try {
        const { documents, options = {} } = req.body;

        if (!documents || !Array.isArray(documents)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Request body must include a "documents" array'
            });
        }

        const processedOptions = {
            ...options,
            localModelPath: options.localModelPath || './models',
            modelCacheDir: options.modelCacheDir || './models'
        };

        const result = await sentenceit(documents, processedOptions);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/sentenceit:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something broke!',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🍱 Semantic Chunking API Server v${VERSION}`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Auth: ${API_AUTH_TOKEN ? '🔒 ENABLED' : '🔓 DISABLED'}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`${'='.repeat(50)}\n`);
});