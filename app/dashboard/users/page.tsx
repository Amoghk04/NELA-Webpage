'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../DashboardShell';
import { adminFetch } from '@/lib/admin-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { BarChart, DonutChart } from '../charts';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  status: string;
  balanceCredits: number;
  packCredits: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async (query?: string) => {
    setError(null);
    try {
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await adminFetch<{ users: UserRow[] }>(`/v1/admin/users${qs}`);
      setUsers(res.users);
    } catch (err) {
      setError(friendlyErrorFromUnknown(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const planCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      map.set(u.plan, (map.get(u.plan) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [users]);

  const balanceBuckets = useMemo(() => {
    const buckets = [
      { label: '0', value: 0 },
      { label: '1–100', value: 0 },
      { label: '101–500', value: 0 },
      { label: '501–2k', value: 0 },
      { label: '2k+', value: 0 },
    ];
    for (const u of users) {
      const b = u.balanceCredits;
      if (b <= 0) buckets[0]!.value++;
      else if (b <= 100) buckets[1]!.value++;
      else if (b <= 500) buckets[2]!.value++;
      else if (b <= 2000) buckets[3]!.value++;
      else buckets[4]!.value++;
    }
    return buckets;
  }, [users]);

  return (
    <DashboardShell>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void load(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email / name"
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-secondary)',
          }}
        />
        <button
          type="submit"
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Search
        </button>
      </form>
      {error ? <p style={{ color: '#e11d48' }}>{error}</p> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <DonutChart
          title="Loaded users by plan"
          subtitle="Current result set"
          data={planCounts}
        />
        <BarChart
          title="Balance distribution"
          subtitle="Credit buckets for loaded users"
          data={balanceBuckets}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Balance</th>
              <th className="py-2">Pack</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <td className="py-2 pr-3">{u.email}</td>
                <td className="py-2 pr-3">{u.plan}</td>
                <td className="py-2 pr-3">{u.status}</td>
                <td className="py-2 pr-3">{u.balanceCredits}</td>
                <td className="py-2">{u.packCredits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
