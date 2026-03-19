# Models

These are the models currently used in our stack, with their role in the pipeline.

<div class="model-grid">
  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">bge-1.5-embed</h3>
      <span class="model-tag">Embedding</span>
    </div>
    <p class="model-desc">
      Generates dense vector embeddings for documents and queries. It is the retrieval backbone used to map text into vector space for fast similarity search.
    </p>
  </article>

  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">distilBert-query-router</h3>
      <span class="model-tag">Routing / Intent</span>
    </div>
    <p class="model-desc">
      Lightweight classifier that routes user queries to the right downstream path (retrieval-heavy, generation-heavy, or specialized tools), keeping latency low.
    </p>
  </article>

  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">grader</h3>
      <span class="model-tag">Evaluation</span>
    </div>
    <p class="model-desc">
      Scores relevance/quality of retrieved context and candidate outputs so the pipeline can pick higher-confidence results and reduce noisy responses.
    </p>
  </article>

  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">kittenTTS</h3>
      <span class="model-tag">Speech</span>
    </div>
    <p class="model-desc">
      Text-to-speech engine used to synthesize spoken output from generated text, enabling voice responses in local workflows.
    </p>
  </article>

  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">LiquidAI-VLM</h3>
      <span class="model-tag">Vision-Language</span>
    </div>
    <p class="model-desc">
      Multimodal model for image + text understanding, useful for visual Q&A, screenshot interpretation, and context grounding from visual inputs.
    </p>
  </article>

  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">LLM</h3>
      <span class="model-tag">Generation</span>
    </div>
    <p class="model-desc">
      Primary large language model responsible for reasoning and response generation over retrieved context and tool outputs.
    </p>
  </article>

  <article class="model-card">
    <div class="model-header">
      <h3 class="model-name">parakeet</h3>
      <span class="model-tag">Speech Recognition</span>
    </div>
    <p class="model-desc">
      Automatic speech recognition (ASR) model that transcribes spoken audio into text before it is routed into the retrieval/generation pipeline.
    </p>
  </article>
</div>

