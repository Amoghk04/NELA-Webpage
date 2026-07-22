import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-28 px-6">
          <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
