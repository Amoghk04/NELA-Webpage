# Models

These are the models currently used in our stack, with their role in the pipeline.

<details>
  <summary>LLM — Generation</summary>
  <p>Primary large language model responsible for reasoning and response generation over retrieved context and tool outputs.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>Qwen3.5-2B-Q4_K_M.gguf</td><td>1.19 GB</td></tr>
      <tr><td>LFM-1.2B-INT8.gguf</td><td>1.16 GB</td></tr>
      <tr><td>Qwen3.5-0.8B-UD-Q4_K_XL.gguf</td><td>533 MB</td></tr>
      <tr><td>Llama-3.2-1B-Instruct-UD-IQ1_S.gguf</td><td>402 MB</td></tr>
    </tbody>
  </table>
</details>

<details>
  <summary>VLM — Vision-Language</summary>
  <p>Multimodal model (LiquidAI-VLM) for image + text understanding, useful for visual Q&A, screenshot interpretation, and context grounding from visual inputs.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>LFM2.5-VL-1.6B-Q4_0.gguf</td><td>664 MB</td></tr>
      <tr><td>LFM2.5-VL-1.6b-Q8_0.gguf</td><td>556 MB</td></tr>
      <tr><td>mmproj-LFM2.5-VL-1.6b-Q8_0.gguf</td><td>556 MB</td></tr>
    </tbody>
  </table>
</details>

<details>
  <summary>ASR — Speech Recognition</summary>
  <p>Automatic speech recognition model (Parakeet) that transcribes spoken audio into text before it is routed into the retrieval/generation pipeline.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>encoder.int8.onnx</td><td>622 MB</td></tr>
      <tr><td>decoder.int8.onnx</td><td>11.3 MB</td></tr>
      <tr><td>joiner.int8.onnx</td><td>6.06 MB</td></tr>
      <tr><td>tokens.txt</td><td>91.7 KB</td></tr>
    </tbody>
  </table>
</details>

<details>
  <summary>TTS — Text-to-Speech</summary>
  <p>Text-to-speech engine (KittenTTS) used to synthesize spoken output from generated text, enabling voice responses in local workflows.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>config.json</td><td>470 B</td></tr>
      <tr><td>kitten_tts_mini_v0_8.onnx</td><td>74.6 MB</td></tr>
      <tr><td>voices.npz</td><td>3.13 MB</td></tr>
    </tbody>
  </table>
</details>

<details>
  <summary>Embedding</summary>
  <p>Generates dense vector embeddings (bge-1.5-embed) for documents and queries. It is the retrieval backbone used to map text into vector space for fast similarity search.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>bge-base-en-v1.5-q8_0.gguf</td><td>113 MB</td></tr>
      <tr><td>bge-small-en-v1.5-q8_0.gguf</td><td>35 MB</td></tr>
    </tbody>
  </table>
</details>

<details>
  <summary>Classifier — Routing</summary>
  <p>Lightweight classifier (distilBert-query-router) that routes user queries to the right downstream path (retrieval-heavy, generation-heavy, or specialized tools), keeping latency low.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>config.json</td><td>781 B</td></tr>
      <tr><td>model.onnx</td><td>740 KB</td></tr>
      <tr><td>model.onnx.data</td><td>255 MB</td></tr>
      <tr><td>special_tokens_map.json</td><td>125 B</td></tr>
      <tr><td>tokenizer_config.json</td><td>1.24 KB</td></tr>
      <tr><td>tokenizer.json</td><td>695 KB</td></tr>
      <tr><td>vocab.txt</td><td>226 KB</td></tr>
    </tbody>
  </table>
</details>

<details>
  <summary>Grader</summary>
  <p>Scores relevance/quality of retrieved context and candidate outputs so the pipeline can pick higher-confidence results and reduce noisy responses.</p>
  <table>
    <thead><tr><th>File</th><th>Size</th></tr></thead>
    <tbody>
      <tr><td>config.json</td><td>787 B</td></tr>
      <tr><td>model_quantized.onnx</td><td>22 MB</td></tr>
      <tr><td>ort_config.json</td><td>764 B</td></tr>
      <tr><td>special_tokens_map.json</td><td>695 B</td></tr>
      <tr><td>tokenizer.json</td><td>515 KB</td></tr>
      <tr><td>vocab.txt</td><td>226 KB</td></tr>
    </tbody>
  </table>
</details>

