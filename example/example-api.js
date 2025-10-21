// ----------------------
// -- example-api.js --
// -------------------------------------------------------------------------------
// This is an example of how to use the semantic-chunking API server
// Make sure the API server is running first:
//   npm run api-server
//   OR
//   docker-compose up -d semantic-chunking-api
// -------------------------------------------------------------------------------

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN || ''; // Set if auth is enabled

// Sample text for testing
const sampleText = `
Artificial intelligence has revolutionized many aspects of modern technology.
Machine learning algorithms can now process vast amounts of data with remarkable accuracy.
Natural language processing enables computers to understand and generate human language.

The field of computer vision has made significant strides in recent years.
Image recognition systems can now identify objects and faces with high precision.
These technologies are being applied in various industries from healthcare to automotive.

Despite these advances, AI systems still face important challenges.
Ethical considerations around bias and fairness remain critical concerns.
The development of responsible AI continues to be a priority for researchers and practitioners.
`.trim();

// Helper function to make API requests
async function apiRequest(endpoint, documents, options = {}) {
    const headers = {
        'Content-Type': 'application/json'
    };

    // Add auth token if provided
    if (API_AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${API_AUTH_TOKEN}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ documents, options })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error (${response.status}): ${error.message || error.error}`);
    }

    return response.json();
}

// Test the API endpoints
async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  🍱 Semantic Chunking API Test Suite                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📡 API URL: ${API_BASE_URL}`);
    console.log(`🔐 Auth: ${API_AUTH_TOKEN ? 'ENABLED' : 'DISABLED'}\n`);

    try {
        // Test 1: Health Check
        console.log('─────────────────────────────────────────────────────');
        console.log('Test 1: Health Check');
        console.log('─────────────────────────────────────────────────────');
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
        const health = await healthResponse.json();
        console.log('✓ Status:', health.status);
        console.log('✓ Version:', health.version);
        console.log('✓ Timestamp:', health.timestamp);

        // Test 2: Version Check
        console.log('\n─────────────────────────────────────────────────────');
        console.log('Test 2: Version Check');
        console.log('─────────────────────────────────────────────────────');
        const versionResponse = await fetch(`${API_BASE_URL}/api/version`);
        const version = await versionResponse.json();
        console.log('✓ Package:', version.package);
        console.log('✓ Version:', version.version);

        // Test 3: Chunkit (Semantic Chunking)
        console.log('\n─────────────────────────────────────────────────────');
        console.log('Test 3: POST /api/chunkit (Semantic Chunking)');
        console.log('─────────────────────────────────────────────────────');
        const startChunkit = performance.now();
        const chunkitResult = await apiRequest(
            '/api/chunkit',
            [
                {
                    document_name: 'test-semantic',
                    document_text: sampleText
                }
            ],
            {
                maxTokenSize: 100,
                similarityThreshold: 0.5,
                returnTokenLength: true
            }
        );
        const chunkitTime = ((performance.now() - startChunkit) / 1000).toFixed(2);
        console.log(`✓ Processing time: ${chunkitTime}s`);
        console.log(`✓ Number of chunks: ${chunkitResult.length}`);
        console.log(`✓ Model: ${chunkitResult[0]?.model_name}`);
        console.log(`✓ Sample chunk 1 (${chunkitResult[0]?.token_length} tokens):`);
        console.log(`  "${chunkitResult[0]?.text.substring(0, 80)}..."`);

        // Test 4: Cramit (Dense Packing)
        console.log('\n─────────────────────────────────────────────────────');
        console.log('Test 4: POST /api/cramit (Dense Packing)');
        console.log('─────────────────────────────────────────────────────');
        const startCramit = performance.now();
        const cramitResult = await apiRequest(
            '/api/cramit',
            [
                {
                    document_name: 'test-cramit',
                    document_text: sampleText
                }
            ],
            {
                maxTokenSize: 100,
                returnTokenLength: true
            }
        );
        const cramitTime = ((performance.now() - startCramit) / 1000).toFixed(2);
        console.log(`✓ Processing time: ${cramitTime}s`);
        console.log(`✓ Number of chunks: ${cramitResult.length}`);
        console.log(`✓ Sample chunk 1 (${cramitResult[0]?.token_length} tokens):`);
        console.log(`  "${cramitResult[0]?.text.substring(0, 80)}..."`);

        // Test 5: Sentenceit (Sentence Splitting)
        console.log('\n─────────────────────────────────────────────────────');
        console.log('Test 5: POST /api/sentenceit (Sentence Splitting)');
        console.log('─────────────────────────────────────────────────────');
        const startSentenceit = performance.now();
        const sentenceitResult = await apiRequest(
            '/api/sentenceit',
            [
                {
                    document_name: 'test-sentences',
                    document_text: sampleText
                }
            ],
            {}
        );
        const sentenceitTime = ((performance.now() - startSentenceit) / 1000).toFixed(2);
        console.log(`✓ Processing time: ${sentenceitTime}s`);
        console.log(`✓ Number of sentences: ${sentenceitResult.length}`);
        console.log(`✓ First sentence:`);
        console.log(`  "${sentenceitResult[0]?.text}"`);
        console.log(`✓ Last sentence:`);
        console.log(`  "${sentenceitResult[sentenceitResult.length - 1]?.text}"`);

        // Summary
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║  ✓ All tests passed successfully!                    ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        // Comparison
        console.log('📊 Results Comparison:');
        console.log('─────────────────────────────────────────────────────');
        console.log(`Chunkit (semantic):  ${chunkitResult.length} chunks`);
        console.log(`Cramit (dense):      ${cramitResult.length} chunks`);
        console.log(`Sentenceit:          ${sentenceitResult.length} sentences`);
        console.log('─────────────────────────────────────────────────────\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nMake sure the API server is running:');
        console.error('  npm run api-server');
        console.error('  OR');
        console.error('  docker-compose up -d semantic-chunking-api\n');
        process.exit(1);
    }
}

// Run the tests
runTests();