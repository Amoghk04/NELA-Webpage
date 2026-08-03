'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../DashboardShell';
import { adminFetch } from '@/lib/admin-api';
import { BarChart, DonutChart } from '../charts';

type EventRow = {
  id: string;
  email: string;
  resolvedMode: string | null;
  selectedModel: string;
  keyLane: string | null;
  estimatedCostUsd: number | null;
  status: string;
  createdAt: string;
};

export default function UsagePage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminFetch<{ events: EventRow[] }>('/v1/admin/usage?limit=100')
      .then((res) => setEvents(res.events))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load'),
      );
  }, []);

  const modeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = e.resolvedMode ?? 'unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [events]);

  const laneCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = e.keyLane ?? 'unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [events]);

  const costByHour = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      if (e.estimatedCostUsd == null || e.estimatedCostUsd <= 0) continue;
      const d = new Date(e.createdAt);
      const key = `${String(d.getHours()).padStart(2, '0')}:00`;
      map.set(key, (map.get(key) ?? 0) + e.estimatedCostUsd);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [events]);

  return (
    <DashboardShell>
      {error ? <p style={{ color: '#e11d48' }}>{error}</p> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <DonutChart
          title="Recent events by mode"
          subtitle="Last 100 usage events"
          data={modeCounts}
        />
        <DonutChart
          title="Recent events by lane"
          subtitle="Free vs paid key lane"
          data={laneCounts}
        />
        {costByHour.length > 0 ? (
          <div className="lg:col-span-2">
            <BarChart
              title="Estimated USD by hour (recent sample)"
              subtitle="Sum of estimatedCostUsd in the loaded window"
              data={costByHour}
              formatValue={(n) => `$${n.toFixed(3)}`}
            />
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Mode</th>
              <th className="py-2 pr-3">Lane</th>
              <th className="py-2 pr-3">USD</th>
              <th className="py-2">Model</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr
                key={e.id}
                className="border-t"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <td className="whitespace-nowrap py-2 pr-3">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-3">{e.email}</td>
                <td className="py-2 pr-3">{e.resolvedMode ?? '—'}</td>
                <td className="py-2 pr-3">{e.keyLane ?? '—'}</td>
                <td className="py-2 pr-3">
                  {e.estimatedCostUsd == null
                    ? '—'
                    : `$${e.estimatedCostUsd.toFixed(4)}`}
                </td>
                <td className="max-w-[220px] truncate py-2">{e.selectedModel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
