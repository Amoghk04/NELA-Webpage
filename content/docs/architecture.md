# Architecture

High-level flow: your content is indexed locally, inference runs on your machine, and results are surfaced in the UI.

Example data flow (conceptual):

```text
UI / CLI
  |
  v
Local Indexer  ---->  Vector Store / Embeddings Cache
  |
  v
Inference Runner ---->  Model (Small/Medium/Large or custom)
  |
  v
Results + Citations (optional)
```

You can extend this page with:
- a diagram image (`![...](./diagram.png)`)
- commands used by the indexer and inference runner
- details about caching, retrieval, and citations

