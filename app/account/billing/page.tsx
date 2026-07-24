import { Suspense } from 'react';
import BillingClient from './BillingClient';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
          <p style={{ color: 'var(--text-secondary)' }}>Loading billing…</p>
        </main>
      }
    >
      <BillingClient />
    </Suspense>
  );
}
