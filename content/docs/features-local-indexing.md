# Local Indexing

NELA builds an index over your workspace and stores embeddings locally for fast retrieval.

## How it works

- Scans files you specify.
- Generates embeddings and caches them.
- Speeds up future queries with local retrieval.

## Architecture snapshot

![Local indexing architecture](/architecture.png)

