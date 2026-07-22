export default function TermsPage() {
  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <article className="max-w-2xl mx-auto">
        <h1 className="font-space text-4xl font-bold tracking-tight mb-6">
          Terms of Service
        </h1>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          By using NELA Desktop or NELA Cloud you agree to these terms.
        </p>
        <h2 className="font-space text-2xl font-semibold mt-8 mb-3">
          Local software
        </h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          The desktop application runs locally. You are responsible for models
          and content you process on your machine.
        </p>
        <h2 className="font-space text-2xl font-semibold mt-8 mb-3">
          Cloud service
        </h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Paid plans grant access to Fast Cloud subject to quotas, fair use, and
          provider availability. Entitlements are determined by the NELA Cloud
          backend after verified billing events.
        </p>
        <h2 className="font-space text-2xl font-semibold mt-8 mb-3">
          Acceptable use
        </h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Do not abuse the API, attempt to extract provider secrets, or use the
          service for unlawful activity.
        </p>
        <p className="mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Last updated: July 22, 2026
        </p>
      </article>
    </main>
  );
}
