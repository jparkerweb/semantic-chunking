# Changelog

All notable changes to this project will be documented in this file.

## [2.4.4] - 2025-07-05
### ✨ Added
- New config option `device` to specify device to use for embedding calculations (e.g., 'cpu' [default], 'webgpu')
- Web UI now supports `device` option

## [2.4.3] - 2025-01-30
### 📦 Updated
- Updated `sentence-parse` to v1.3.1 (wont crash on null inputs)

## [2.4.2] - 2025-01-06
### 📦 Updated
- Updated sentence splitter to use `sentence-parse`

## [2.4.1] - 2024-12-15
### 📦 Updated
- Updated sentence splitter to use `@stdlib/nlp-sentencize`
- Updated embedding cache to use `lru-cache`

## [2.4.0] - 2024-12-13
### ✨ Added
- Added `sentenceit` function (split by sentence and return embeddings)

## [2.3.7] - 2024-11-25
### 📦 Updated
- Update `string-segmenter` patch version

## [2.3.6] - 2024-11-18
### 📦 Updated
- Update `string-segmenter` patch version

## [2.3.5] - 2024-11-13
### 📦 Updated
- Only print version if logging is enabled (default is false)
  - was adding console noise to upstream applications

## [2.3.4] - 2024-11-12
### 📦 Updated
- Updated Web UI to v1.3.1
- Updated README with Web UI usage examples
- Updated default values in both the library and Web UI
  - Web UI default can be set in `webui/public/default-form-values.js`
- Misc cleanup and optimizations

## [2.3.0] - 2024-11-11
### 📦 Updated
- Updated `transformers.js` from v2 to v3
- Migrated quantization option from `onnxEmbeddingModelQuantized` (boolean) to `dtype` ('p32', 'p16', 'q8', 'q4')
- Updated Web UI to use new `dtype` option

## [2.2.5] - 2024-11-08
### 📦 Updated
- Updated Web UI styles for smaller screens

## [2.2.4] - 2024-11-08
### 🐛 Fixed
- Fixed issue with Web UI embedding cache not being cleared when a new model is initialized

## [2.2.3] - 2024-11-07
### ✨ Added
- Web UI adjustments for display of truncated JSON results on screen but still allowing download of full results

## [2.2.2] - 2024-11-07
### ✨ Added
- Web UI css adjustments for smaller screens

## [2.2.1] - 2024-11-06
### ✨ Added
- Added Highlight.js to Web UI for syntax highlighting of JSON results and code samples
- Added JSON results toggle button to turn line wrapping on/off

## [2.2.0] - 2024-11-05
### ✨ Added
- New Web UI tool for experimenting with semantic chunking settings
  - Interactive form interface for all chunking parameters
  - Real-time text processing and results display
  - Visual feedback for similarity thresholds
  - Model selection and configuration
  - Results download in JSON format
  - Code generation for settings
  - Example texts for testing
  - Dark mode interface
- Added `excludeChunkPrefixInResults` option to `chunkit` and `cramit` functions
  - Allows removal of chunk prefix from final results while maintaining prefix for embedding calculations

### 📦 Updated
- Improved error handling and feedback in chunking functions
- Enhanced documentation with Web UI usage examples
- Added more embedding models to supported list

### 🐛 Fixed
- Fixed issue with chunk prefix handling in embedding calculations
- Improved token length calculation reliability

## [2.1.4] - 2024-03-01
### 📦 Updated
- Updated README `cramit` example script to use updated document object input format.

## [2.1.3] - 2024-11-04
### 🐛 Fixed
- Fixed `cramit` function to properly pack sentences up to maxTokenSize

### 📦 Updated
- Improved chunk creation logic to better handle both chunkit and cramit modes
- Enhanced token size calculation efficiency

## [2.1.2] - 2024-11-04
### 🐛 Fixed
- Improved semantic chunking accuracy with stricter similarity thresholds
- Enhanced logging in similarity calculations for better debugging
- Fixed chunk creation to better respect semantic boundaries

### 📦 Updated
- Default similarity threshold increased to 0.5
- Default dynamic threshold bounds adjusted (0.4 - 0.8)
- Improved chunk rebalancing logic with similarity checks
- Updated logging for similarity scores between sentences

## [2.1.1] - 2024-11-01
### 📦 Updated
- Updated example scripts in README.

## [2.1.0] - 2024-11-01
### 📦 Updated
- ⚠️ **BREAKING**: Input format now accepts array of document objects
- Output array of chunks extended with the following new properties:
  - `document_id`: Timestamp in milliseconds when processing started
  - `document_name`: Original document name or ""
  - `number_of_chunks`: Total number of chunks for the document
  - `chunk_number`: Current chunk number (1-based)
  - `model_name`: Name of the embedding model used
  - `is_model_quantized`: Whether the model is quantized

## [2.0.0] - 2024-11-01
### ✨ Added
- Added `returnEmbedding` option to `chunkit` and `cramit` functions to include embeddings in the output.
- Added `returnTokenLength` option to `chunkit` and `cramit` functions to include token length in the output.
- Added `chunkPrefix` option to prefix each chunk with a task instruction (e.g., "search_document: ", "search_query: ").
- Updated README to document new options and add RAG tips for using `chunkPrefix` with embedding models that support task prefixes.

### 📦 Updated
- ⚠️ **BREAKING**: Returned array of chunks is now an array of objects with `text`, `embedding`, and `tokenLength` properties. Previous versions returned an array of strings.

## [1.5.1] - 2024-11-01
### 🐛 Fixed
- Fixed sentence splitter logic in `cramit` function..

## [1.5.0] - 2024-10-11
### 📦 Updated
- Replaced sentence splitter with a new algorithm that is more accurate and faster.

## [1.4.0] - 2024-09-24
### ✨ Added
- Breakup library into modules for easier maintenance and updates going forward.

## [1.3.0] - 2024-09-09
### ✨ Added
- Added download script to pre-download models for users that want pre-package them with their application.
- Added model path/cache directory options.

### 📦 Updated
- Updated package dependencies.
- Updated example scripts.
- Updated README.

## [1.1.0] - 2024-05-09
### ✨ Added
- Added dynamic combining of final chunks based on similarity threshold.

### 📦 Updated
- Improved initial chunking algorithm to reduce the number of chunks.

## [1.0.0] - 2024-02-29
### ✨ Added
- Initial release with basic chunking functionality. 
