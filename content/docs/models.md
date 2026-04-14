# Models

NELA uses specialized model classes for different tasks. The task router picks from installed models based on task type and model priority.

<div class="model-grid">
  <div class="model-card">
    <div class="model-header">
      <h3 class="model-name">LLM</h3>
      <span class="model-tag">Generation</span>
    </div>
    <p class="model-desc">General text generation for chat, summarization, enrichment, mindmaps, and podcast scripting.</p>
    <ul>
      <li>Examples: Qwen3.5 0.8B Q4, Qwen3.5 2B Q4, LFM 1.2B INT8.</li>
      <li>Use this class for normal conversation and reasoning tasks.</li>
    </ul>
  </div>

  <div class="model-card">
    <div class="model-header">
      <h3 class="model-name">VLM</h3>
      <span class="model-tag">Vision</span>
    </div>
    <p class="model-desc">Vision-language inference for image-grounded Q&amp;A.</p>
    <ul>
      <li>Uses both a vision model file and a projector (`mmproj`) file.</li>
      <li>Selected automatically when you run Vision mode tasks.</li>
    </ul>
  </div>

  <div class="model-card">
    <div class="model-header">
      <h3 class="model-name">ASR</h3>
      <span class="model-tag">Speech Input</span>
    </div>
    <p class="model-desc">Speech-to-text transcription pipeline used for microphone and audio-to-text flows.</p>
    <ul>
      <li>Current stack uses Parakeet TDT assets.</li>
      <li>Feeds transcribed text into normal chat or workflow prompts.</li>
    </ul>
  </div>

  <div class="model-card">
    <div class="model-header">
      <h3 class="model-name">TTS</h3>
      <span class="model-tag">Speech Output</span>
    </div>
    <p class="model-desc">Text-to-speech generation for audio outputs and podcast rendering.</p>
    <ul>
      <li>Current stack uses KittenTTS ONNX runtime assets.</li>
      <li>Supports voice selection and pacing controls in app workflows.</li>
    </ul>
  </div>

  <div class="model-card">
    <div class="model-header">
      <h3 class="model-name">Embedding</h3>
      <span class="model-tag">RAG Retrieval</span>
    </div>
    <p class="model-desc">Converts chunks and queries into vectors for local similarity search.</p>
    <ul>
      <li>Current options include BGE small and BGE base variants.</li>
      <li>Higher-dimensional embeddings usually improve retrieval quality.</li>
    </ul>
  </div>

  <div class="model-card">
    <div class="model-header">
      <h3 class="model-name">Classifier + Grader</h3>
      <span class="model-tag">Quality Control</span>
    </div>
    <p class="model-desc">Classifier routes intent; grader reranks retrieval evidence for better final context.</p>
    <ul>
      <li>Classifier: DistilBERT ONNX query router.</li>
      <li>Grader: MS MARCO MiniLM cross-encoder.</li>
    </ul>
  </div>
</div>

Suggested install order for new users:

1. Install one LLM first.
2. Add VLM only if you need image Q&amp;A.
3. Add TTS/ASR for audio workflows.
4. Add Embedding, Classifier, and Grader for stronger RAG quality.

> [!NOTE]
> If you switch embedding families with different dimensions (for example BGE small to BGE base), re-ingest your documents so vector dimensions stay compatible.

