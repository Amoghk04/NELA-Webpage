'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../DashboardShell';
import { adminFetch } from '@/lib/admin-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { BarChart, DonutChart } from '../charts';

type Entry = {
  id: string;
  email: string;
  delta: number;
  reason: string;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export default function CreditsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminFetch<{ entries: Entry[] }>('/v1/admin/credits?limit=100')
      .then((res) => setEntries(res.entries))
      .catch((err: unknown) =>
        setError(friendlyErrorFromUnknown(err)),
      );
  }, []);

  const reasonCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.reason, (map.get(e.reason) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [entries]);

  const absByReason = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.reason, (map.get(e.reason) ?? 0) + Math.abs(e.delta));
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [entries]);

  return (
    <DashboardShell>
      {error ? <p style={{ color: '#e11d48' }}>{error}</p> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <DonutChart
          title="Ledger events by reason"
          subtitle="Last 100 ledger rows"
          data={reasonCounts}
        />
        <BarChart
          title="Credits moved by reason"
          subtitle="Sum of |delta| in the loaded window"
          data={absByReason}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Δ</th>
              <th className="py-2 pr-3">Reason</th>
              <th className="py-2 pr-3">After</th>
              <th className="py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-t"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <td className="whitespace-nowrap py-2 pr-3">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-3">{e.email}</td>
                <td className="py-2 pr-3">{e.delta}</td>
                <td className="py-2 pr-3">{e.reason}</td>
                <td className="py-2 pr-3">{e.balanceAfter}</td>
                <td className="max-w-[240px] truncate py-2">{e.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
