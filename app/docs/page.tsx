import DocsSidebar from '../../components/DocsSidebar';

export default function DocsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16 flex gap-8" style={{ color: 'var(--text-primary)' }}>
      <DocsSidebar />

      <div className="prose max-w-none" style={{ color: 'var(--text-secondary)' }}>
        <section id="installation">
          <h1 style={{ color: 'var(--text-primary)' }}>Installation</h1>
          <p>
            Install the app or CLI using the provided binaries. For now this is a
            placeholder — include package or binary install steps here.
          </p>
          <pre className="p-3 rounded text-sm" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>npm install --global nela</pre>
        </section>

        <section id="models">
          <h2 style={{ color: 'var(--text-primary)' }}>Models</h2>
          <p>
            Describe available models, local-only options, and how to switch or
            configure model files.
          </p>
          <ul>
            <li>Small (fast, low-resources)</li>
            <li>Medium (balanced)</li>
            <li>Large (best quality)</li>
          </ul>
        </section>

        <section id="how-it-works">
          <h2 style={{ color: 'var(--text-primary)' }}>How it works</h2>
          <p>
            Overview of architecture: local indexing, private inference, and the
            UI integrations.
          </p>
          <p>
            Add diagrams or step-by-step flow here to explain the internal
            components and data flow.
          </p>
        </section>
      </div>
    </main>
  );
}
