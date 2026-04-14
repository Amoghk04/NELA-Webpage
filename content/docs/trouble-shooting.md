# Trouble Shooting

Common issues and quick fixes for local NELA workflows.

## Indexing is slow

- Start with a small folder to verify end-to-end ingestion first.
- Use a lighter embedding model while validating your pipeline.
- Keep enough free disk space for chunk/index growth.
- First ingestion is the slowest; repeat queries are usually faster after index warmup.
- If retrieval quality suddenly drops after changing embedding model family, rebuild the index from scratch.

## Model download fails

Most failures come from network interruptions, insufficient disk, or incompatible model choice.

- Check internet/proxy access while downloading.
- Verify free space in the models directory target.
- Try a smaller model first to confirm your environment is healthy.
- Confirm the model appears as installed before selecting it in a mode.

If running from source with custom model storage, verify your path:

```bash
echo $GENHAT_MODEL_PATH
```

