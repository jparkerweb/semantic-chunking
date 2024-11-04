# Changelog

All notable changes to this project will be documented in this file.

## [2.1.3] - 2024-11-04
### Fixed
- Fixed `cramit` function to properly pack sentences up to maxTokenSize

### Updated
- Improved chunk creation logic to better handle both chunkit and cramit modes
- Enhanced token size calculation efficiency

## [2.1.2] - 2024-11-04
### Fixed
- Improved semantic chunking accuracy with stricter similarity thresholds
- Enhanced logging in similarity calculations for better debugging
- Fixed chunk creation to better respect semantic boundaries

### Updated
- Default similarity threshold increased to 0.5
- Default dynamic threshold bounds adjusted (0.4 - 0.8)
- Improved chunk rebalancing logic with similarity checks
- Updated logging for similarity scores between sentences

## [2.1.1] - 2024-11-01
### Updated
- Updated example scripts in README.

## [2.1.0] - 2024-11-01
### Updated
- ⚠️ **BREAKING**: Input format now accepts array of document objects
- Output array of chunks extended with the following new properties:
  - `document_id`: Timestamp in milliseconds when processing started
  - `document_name`: Original document name or ""
  - `number_of_chunks`: Total number of chunks for the document
  - `chunk_number`: Current chunk number (1-based)
  - `model_name`: Name of the embedding model used
  - `is_model_quantized`: Whether the model is quantized

## [2.0.0] - 2024-11-01
### Added
- Added `returnEmbedding` option to `chunkit` and `cramit` functions to include embeddings in the output.
- Added `returnTokenLength` option to `chunkit` and `cramit` functions to include token length in the output.
- Added `chunkPrefix` option to prefix each chunk with a task instruction (e.g., "search_document: ", "search_query: ").
- Updated README to document new options and add RAG tips for using `chunkPrefix` with embedding models that support task prefixes.

### Updated
- ⚠️ **BREAKING**: Returned array of chunks is now an array of objects with `text`, `embedding`, and `tokenLength` properties. Previous versions returned an array of strings.

---

## [1.5.1] - 2024-11-01
### Fixed
- Fixed sentence splitter logic in `cramit` function..

---

## [1.5.0] - 2024-10-11
### Updated
- Replaced sentence splitter with a new algorithm that is more accurate and faster.

---

## [1.4.0] - 2024-09-24
### Added
- Breakup library into modules for easier maintenance and updates going forward.

---

## [1.3.0] - 2024-09-09
### Added
- Added download script to pre-download models for users that want pre-package them with their application.
- Added model path/cache directory options.

### Updated
- Updated package dependencies.
- Updated example scripts.
- Updated README.

---

## [1.1.0] - 2024-05-09
### Added
- Added dynamic combining of final chunks based on similarity threshold.

### Updated
- Improved initial chunking algorithm to reduce the number of chunks.

---

## [1.0.0] - 2024-02-29
### Added
- Initial release with basic chunking functionality. 