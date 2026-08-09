import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-28 px-6">
          <p style={{ color: 'var(--text-secondary)' }}>Verifying…</p>
        </main>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
