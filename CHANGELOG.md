# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024-11-01
### Added
- Added `returnEmbedding` option to `chunkit` and `cramit` functions to include embeddings in the output.
- Added `returnTokenLength` option to `chunkit` and `cramit` functions to include token length in the output.
- Added `chunkPrefix` option to prefix each chunk with a task instruction (e.g., "search_document: ", "search_query: ").
- Updated README to document new options and add RAG tips for using `chunkPrefix` with embedding models that support task prefixes.

### ⚠️ Breaking Changes
- Returned array of chunks is now an array of objects with `text`, `embedding`, and `tokenLength` properties. Previous versions returned an array of strings.

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