# Installation

NELA is primarily used as a desktop app. Most users should install a release build from the Downloads page, then install models from inside Settings.

The npm flow below is for running NELA from source.

## Download from website

You can also install NELA directly from the website Download tab.

1. Open the [Download tab](/download).
2. Select your operating system and preferred version.
3. Download the installer and run it.

## Install via npm

```bash
cd genhat-desktop
npm ci
npx tauri dev
```

Prerequisites for source runs:

- Node.js 24 or newer
- Rust stable toolchain
- Linux desktop dependencies for Tauri (`webkit2gtk`, `gtk3`, `asound`, and related dev packages)

## Install a model (example)

Inside the app:

1. Open **Settings** from the sidebar.
2. Choose a model category (LLM, Vision, TTS, ASR, Embedding, Classifier, Grader).
3. Download a compatible model.
4. Return to the main view and select that model for your current mode.

Optional for custom model locations in source/dev runs:

```bash
export GENHAT_MODEL_PATH=/absolute/path/to/models
```

Set `GENHAT_MODEL_PATH` before launching if models are stored outside the default repository `models` directory.

