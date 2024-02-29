# semantic-chunking
semantically create chunks from large text (useful for passing to LLM workflows)

---

### Install:
- `npm install semantic-chunking`

---

### Usage:
```
import { chunkit } from 'semantic-chunking';

let text = "some long text...";
let myChunks = chunkit(text);
```
