# Trouble Shooting

Common issues and quick fixes. If you still get stuck, include logs and your environment (OS, RAM/GPU, model size).

## Indexing is slow

- Start with a smaller directory to validate setup.
- Reduce included file types.
- Re-run after the first cache build.

## Model download fails

Check network/proxy settings and ensure you have enough disk space.

```bash
nela models list
nela models download --name Small --verbose
```

