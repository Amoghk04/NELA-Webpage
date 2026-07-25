'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/nela-api';

const INTERVAL_MS = 5 * 60 * 1000;

export default function DontDiePage() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [status, setStatus] = useState(0);
  const [detail, setDetail] = useState('Starting…');
  const [lastAt, setLastAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      const url = `${getApiBaseUrl()}/healthz`;
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        if (cancelled) return;
        const healthy = res.ok && body?.ok === true;
        setOk(healthy);
        setStatus(res.status);
        setDetail(healthy ? 'API healthy' : `Unexpected response (${res.status})`);
        setLastAt(new Date().toLocaleTimeString());
      } catch (err) {
        if (cancelled) return;
        setOk(false);
        setStatus(0);
        setDetail(err instanceof Error ? err.message : String(err));
        setLastAt(new Date().toLocaleTimeString());
      }
    };

    void ping();
    const id = window.setInterval(() => void ping(), INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <article className="max-w-2xl mx-auto">
        <h1 className="font-space text-4xl font-bold tracking-tight mb-6">
          Keep alive
        </h1>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Pings the API <code>/healthz</code> every 5 minutes so Render stays warm.
        </p>
        <p
          className="text-sm font-mono"
          style={{
            color:
              ok === null
                ? 'var(--text-tertiary)'
                : ok
                  ? 'var(--text-secondary)'
                  : '#e11d48',
          }}
        >
          {ok === null
            ? detail
            : ok
              ? `ok · ${status}${lastAt ? ` · ${lastAt}` : ''}`
              : `fail · ${detail}${lastAt ? ` · ${lastAt}` : ''}`}
        </p>
      </article>
    </main>
  );
}
