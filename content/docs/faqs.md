# FAQs

<details>
  <summary>Is NELA fully local?</summary>
  <p>Core workflows are local-first. Inference, indexing, and retrieval are designed to run on-device. Internet is mainly needed for model downloads and optional remote browsing flows.</p>
</details>

<details>
  <summary>Do I need every model category installed?</summary>
  <p>No. Start with one LLM for chat. Add VLM for image tasks, TTS/ASR for audio workflows, and Embedding/Classifier/Grader for stronger RAG quality.</p>
</details>

<details>
  <summary>What is the difference between Chat, Vision, Audio, Podcast, and Mindmap modes?</summary>
  <p>Each mode maps to a different task path in the backend router: Chat for general text/RAG, Vision for image-grounded prompts, Audio for speech workflows, Podcast for scripted two-speaker generation, and Mindmap for concept-tree outputs.</p>
</details>

<details>
  <summary>Why are my RAG answers weak even though files are uploaded?</summary>
  <p>Check that embedding models are installed and ingestion completed successfully. For better retrieval quality, install classifier and grader models as well. Rebuild the index if you changed embedding model family.</p>
</details>

<details>
  <summary>Can I move a project between machines?</summary>
  <p>Yes. Export your workspace as a <code>.nela</code> project file and import it on another machine. Keep in mind that model files may still need to be installed on the destination machine.</p>
</details>

<details>
  <summary>How do I choose a model size for my hardware?</summary>
  <p>Use the compatibility hints in Settings. Smaller quantized models are faster and lighter; larger models may improve quality but need more RAM/CPU and disk.</p>
</details>


