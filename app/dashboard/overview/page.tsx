'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '../DashboardShell';
import { adminFetch } from '@/lib/admin-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import {
  AreaChart,
  BarChart,
  BreakageGauge,
  DonutChart,
  DualBarChart,
} from '../charts';

type Overview = {
  users: number;
  premiumUsers: number;
  week: {
    paidRequests: number;
    realizedCogsUsd: number;
    impliedCogsUsd: number;
    creditsGranted: number;
    creditsBurned: number;
    breakagePct: number | null;
    revenuePaise: number;
    revenueInr: number;
    burnP50: number;
    burnP90: number;
    grossApproxInr: number | null;
  };
  wallets: { totalBalance: number; totalPackCredits: number };
  orUsdPerCredit: number;
  usdInrRate: number;
  refreshedAt: string;
  fromMaterializedView: boolean;
};

type Series = {
  days: number;
  daily: Array<{
    day: string;
    revenuePaise: number;
    creditsGranted: number;
    creditsBurned: number;
    paidRequests: number;
    realizedCogsUsd: number;
  }>;
  modes: Array<{ mode: string; count: number }>;
  plans: Array<{ plan: string; count: number }>;
};

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [overview, seriesRes] = await Promise.all([
      adminFetch<Overview>('/v1/admin/overview'),
      adminFetch<Series>('/v1/admin/overview/series?days=14'),
    ]);
    setData(overview);
    setSeries(seriesRes);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) =>
      setError(friendlyErrorFromUnknown(err)),
    );
  }, [load]);

  const forceRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await adminFetch<{ snapshot: Overview }>(
        '/v1/admin/metrics/refresh',
        { method: 'POST' },
      );
      setData(res.snapshot);
      const seriesRes = await adminFetch<Series>(
        '/v1/admin/overview/series?days=14',
      );
      setSeries(seriesRes);
    } catch (err) {
      setError(friendlyErrorFromUnknown(err));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {data
            ? `Snapshot ${new Date(data.refreshedAt).toLocaleString()} · ${
                data.fromMaterializedView ? 'materialized view' : 'live fallback'
              }`
            : null}
        </p>
        <button
          type="button"
          disabled={refreshing}
          onClick={() => void forceRefresh()}
          className="rounded-full border px-3 py-1 text-sm disabled:opacity-50"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh metrics'}
        </button>
      </div>
      {error ? <p style={{ color: '#e11d48' }}>{error}</p> : null}
      {!data && !error ? <p>Loading…</p> : null}

      {data ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Users" value={String(data.users)} />
            <Metric label="Premium" value={String(data.premiumUsers)} />
            <Metric
              label="Week revenue"
              value={`₹${data.week.revenueInr.toFixed(0)}`}
            />
            <Metric
              label="Week gross (approx)"
              value={
                data.week.grossApproxInr == null
                  ? 'n/a'
                  : `₹${data.week.grossApproxInr.toFixed(0)}`
              }
            />
          </div>

          {series ? (
            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <BarChart
                title="Revenue (14d)"
                subtitle="Daily INR from successful checkouts"
                data={series.daily.map((d) => ({
                  label: d.day,
                  value: d.revenuePaise / 100,
                }))}
                formatValue={(n) => `₹${n.toFixed(0)}`}
              />
              <DualBarChart
                title="Credits granted vs burned"
                subtitle="Subscription/pack grants vs usage burns"
                data={series.daily.map((d) => ({
                  label: d.day,
                  a: d.creditsGranted,
                  b: d.creditsBurned,
                }))}
                aLabel="Granted"
                bLabel="Burned"
              />
              <AreaChart
                title="OpenRouter COGS (USD)"
                subtitle="Realized estimated spend per day"
                data={series.daily.map((d) => ({
                  label: d.day,
                  value: d.realizedCogsUsd,
                }))}
                formatValue={(n) => `$${n.toFixed(2)}`}
              />
              <BarChart
                title="Paid cloud requests"
                subtitle="Requests with estimatedCostUsd > 0"
                data={series.daily.map((d) => ({
                  label: d.day,
                  value: d.paidRequests,
                }))}
              />
              <DonutChart
                title="Usage by mode (14d)"
                subtitle="Resolved Fast / Smart / Deep mix"
                data={series.modes.map((m) => ({
                  label: m.mode,
                  value: m.count,
                }))}
              />
              <DonutChart
                title="Users by plan"
                subtitle="Current entitlement plan"
                data={series.plans.map((p) => ({
                  label: p.plan,
                  value: p.count,
                }))}
              />
              <BreakageGauge
                granted={data.week.creditsGranted}
                burned={data.week.creditsBurned}
              />
              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: 'var(--border-primary)',
                  background: 'var(--bg-card)',
                }}
              >
                <h3 className="mb-3 font-space text-sm font-semibold">
                  Week snapshot
                </h3>
                <dl className="space-y-2 text-sm">
                  <Row
                    k="Breakage"
                    v={
                      data.week.breakagePct == null
                        ? 'n/a'
                        : `${data.week.breakagePct.toFixed(1)}%`
                    }
                  />
                  <Row
                    k="Burn p50 / p90"
                    v={`${data.week.burnP50.toFixed(0)} / ${data.week.burnP90.toFixed(0)} cr`}
                  />
                  <Row
                    k="OR COGS (realized)"
                    v={`$${data.week.realizedCogsUsd.toFixed(2)}`}
                  />
                  <Row
                    k="Implied COGS"
                    v={`$${data.week.impliedCogsUsd.toFixed(2)}`}
                  />
                  <Row
                    k="Wallet balance"
                    v={String(data.wallets.totalBalance)}
                  />
                  <Row
                    k="Pack credits"
                    v={String(data.wallets.totalPackCredits)}
                  />
                </dl>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
    >
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p className="mt-1 font-space text-xl font-bold">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: 'var(--text-secondary)' }}>{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
    </div>
  );
}
