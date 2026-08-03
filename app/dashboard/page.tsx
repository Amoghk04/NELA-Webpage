'use client';

import { Suspense } from 'react';
import DashboardLoginPage from './DashboardLoginInner';

export default function DashboardLoginRoute() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
          <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        </main>
      }
    >
      <DashboardLoginPage />
    </Suspense>
  );
}
