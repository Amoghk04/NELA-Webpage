'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../DashboardShell';
import { adminFetch } from '@/lib/admin-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { AreaChart, BarChart } from '../charts';

type SortField =
  | 'score'
  | 'requests'
  | 'successRate'
  | 'ttftP50'
  | 'ttftP95'
  | 'latencyP50'
  | 'tokensPerSec'
  | 'totalCostUsd'
  | 'costPer1kOutput'
  | 'lastSeen';

type LeaderboardRow = {
  key: string;
  label: string;
  providerName: string | null;
  modelId: string | null;
  requests: number;
  sampleCount: number;
  successCount: number;
  errorCount: number;
  rateLimitCount: number;
  successRate: number;
  ttftP50Ms: number | null;
  ttftP95Ms: number | null;
  ttfbP50Ms: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  tokensPerSecP50: number | null;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  totalCostUsd: number;
  avgCostUsd: number;
  costPer1kOutput: number | null;
  lastSeen: string | null;
  score: number | null;
  scoreComponents: {
    reliability: number;
    ttft: number;
    throughput: number;
    cost: number;
  } | null;
  insufficientSamples: boolean;
};

type InferenceResponse = {
  days: number;
  minSamples: number;
  overview: {
    requests: number;
    successRate: number;
    providers: number;
    models: number;
    ttftP50Ms: number | null;
    tokensPerSecP50: number | null;
    totalCostUsd: number;
    pendingEnrichment: number;
  };
  daily: Array<{
    day: string;
    requests: number;
    successRate: number;
    ttftP50Ms: number | null;
    tokensPerSecP50: number | null;
    totalCostUsd: number;
  }>;
  providers: LeaderboardRow[];
  models: LeaderboardRow[];
  providerModels: LeaderboardRow[];
};

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'score', label: 'Balanced score' },
  { value: 'requests', label: 'Requests' },
  { value: 'successRate', label: 'Success rate' },
  { value: 'ttftP50', label: 'TTFT p50' },
  { value: 'ttftP95', label: 'TTFT p95' },
  { value: 'latencyP50', label: 'Latency p50' },
  { value: 'tokensPerSec', label: 'Tokens/sec' },
  { value: 'totalCostUsd', label: 'Total cost' },
  { value: 'costPer1kOutput', label: 'Cost / 1K out' },
  { value: 'lastSeen', label: 'Last seen' },
];

function fmtMs(v: number | null | undefined): string {
  if (v == null) return '—';
  return `${Math.round(v)} ms`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtUsd(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(3)}`;
}

function fmtNum(v: number | null | undefined, digits = 1): string {
  if (v == null) return '—';
  return v.toFixed(digits);
}

export default function InferencePage() {
  const [data, setData] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [mode, setMode] = useState('');
  const [minSamples, setMinSamples] = useState(10);
  const [sort, setSort] = useState<SortField>('score');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showScoreHelp, setShowScoreHelp] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('days', String(days));
    params.set('minSamples', String(minSamples));
    params.set('sort', sort);
    params.set('dir', dir);
    if (provider.trim()) params.set('provider', provider.trim());
    if (model.trim()) params.set('model', model.trim());
    if (mode.trim()) params.set('mode', mode.trim());
    return params.toString();
  }, [days, provider, model, mode, minSamples, sort, dir]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<InferenceResponse>(
        `/v1/admin/inference?${query}`,
      );
      setData(res);
    } catch (err) {
      setError(friendlyErrorFromUnknown(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSort = (field: SortField) => {
    if (sort === field) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setDir(field === 'ttftP50' || field === 'ttftP95' || field === 'latencyP50' || field === 'costPer1kOutput' ? 'asc' : 'desc');
    }
  };

  return (
    <DashboardShell>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-space text-lg font-semibold">Inference</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            OpenRouter provider &amp; model leaderboard from durable request
            telemetry (no prompt/completion text stored).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: 'var(--border-primary)' }}
            onClick={() => setShowScoreHelp((v) => !v)}
          >
            Score methodology
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-full border px-3 py-1 text-sm disabled:opacity-50"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {showScoreHelp ? (
        <div
          className="mb-4 rounded-xl border p-4 text-sm"
          style={{
            borderColor: 'var(--border-primary)',
            background: 'var(--bg-card)',
          }}
        >
          <p className="font-medium">Balanced score (0–100)</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Applied only when a group has at least {minSamples} samples in the
            current filter. Weights: reliability 35% (success rate), TTFT 25%
            (lower is better, normalized vs peers), throughput 25% (median
            tokens/sec, higher better), cost efficiency 15% (USD per 1K output
            tokens, lower better). Rows below the sample threshold stay
            sortable on raw metrics but are not ranked by score.
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Period</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border px-2 py-1"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            {[1, 7, 30, 90].map((d) => (
              <option key={d} value={d}>
                {d}d
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Provider</span>
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. anthropic"
            className="w-36 rounded border px-2 py-1"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Model</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="contains…"
            className="w-40 rounded border px-2 py-1"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded border px-2 py-1"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <option value="">All</option>
            <option value="fast">fast</option>
            <option value="smart">smart</option>
            <option value="deep">deep</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Min samples</span>
          <input
            type="number"
            min={1}
            max={100}
            value={minSamples}
            onChange={(e) => setMinSamples(Number(e.target.value) || 10)}
            className="w-16 rounded border px-2 py-1"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortField)}
            className="rounded border px-2 py-1"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            style={{ borderColor: 'var(--border-primary)' }}
            onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          >
            {dir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </label>
      </div>

      {error ? <p style={{ color: '#e11d48' }}>{error}</p> : null}
      {!data && !error ? <p>Loading…</p> : null}

      {data ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Requests" value={String(data.overview.requests)} />
            <Metric
              label="Success rate"
              value={fmtPct(data.overview.successRate)}
            />
            <Metric
              label="Providers / models"
              value={`${data.overview.providers} / ${data.overview.models}`}
            />
            <Metric
              label="TTFT p50"
              value={fmtMs(data.overview.ttftP50Ms)}
            />
            <Metric
              label="Tokens/sec p50"
              value={fmtNum(data.overview.tokensPerSecP50)}
            />
            <Metric
              label="Total cost"
              value={fmtUsd(data.overview.totalCostUsd)}
            />
            <Metric
              label="Pending enrichment"
              value={String(data.overview.pendingEnrichment)}
            />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <BarChart
              title={`Requests (${data.days}d)`}
              subtitle="Daily generation count"
              data={data.daily.map((d) => ({
                label: d.day,
                value: d.requests,
              }))}
            />
            <AreaChart
              title="TTFT p50 (ms)"
              subtitle="Median time to first token"
              data={data.daily.map((d) => ({
                label: d.day,
                value: d.ttftP50Ms ?? 0,
              }))}
              formatValue={(n) => `${Math.round(n)} ms`}
            />
            <BarChart
              title="Tokens/sec p50"
              subtitle="Median throughput"
              data={data.daily.map((d) => ({
                label: d.day,
                value: d.tokensPerSecP50 ?? 0,
              }))}
              formatValue={(n) => n.toFixed(1)}
            />
            <AreaChart
              title="Cost (USD)"
              subtitle="Daily total cost from telemetry"
              data={data.daily.map((d) => ({
                label: d.day,
                value: d.totalCostUsd,
              }))}
              formatValue={(n) => `$${n.toFixed(3)}`}
            />
          </div>

          <LeaderboardTable
            title="Provider leaderboard"
            rows={data.providers}
            sort={sort}
            dir={dir}
            onSort={toggleSort}
            expanded={expanded}
            onExpand={setExpanded}
            idPrefix="provider"
          />
          <LeaderboardTable
            title="Model leaderboard"
            rows={data.models}
            sort={sort}
            dir={dir}
            onSort={toggleSort}
            expanded={expanded}
            onExpand={setExpanded}
            idPrefix="model"
          />
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
      <p className="mt-1 font-space text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SortTh({
  label,
  field,
  sort,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  dir: 'asc' | 'desc';
  onSort: (f: SortField) => void;
}) {
  const active = sort === field;
  return (
    <th className="px-2 py-2 text-left font-medium">
      <button
        type="button"
        className="inline-flex items-center gap-1"
        onClick={() => onSort(field)}
        style={{ color: active ? 'var(--accent)' : undefined }}
      >
        {label}
        {active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );
}

function LeaderboardTable({
  title,
  rows,
  sort,
  dir,
  onSort,
  expanded,
  onExpand,
  idPrefix,
}: {
  title: string;
  rows: LeaderboardRow[];
  sort: SortField;
  dir: 'asc' | 'desc';
  onSort: (f: SortField) => void;
  expanded: string | null;
  onExpand: (id: string | null) => void;
  idPrefix: string;
}) {
  return (
    <div
      className="mb-8 overflow-x-auto rounded-xl border"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border-primary)' }}>
        <h3 className="font-space text-sm font-semibold">{title}</h3>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr style={{ color: 'var(--text-secondary)' }}>
            <SortTh label="Name" field="score" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="Score" field="score" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="Reqs" field="requests" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="Success" field="successRate" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="TTFT p50" field="ttftP50" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="tok/s" field="tokensPerSec" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="Cost" field="totalCostUsd" sort={sort} dir={dir} onSort={onSort} />
            <SortTh label="$/1K out" field="costPer1kOutput" sort={sort} dir={dir} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                No telemetry in this window yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = `${idPrefix}:${row.key}`;
              const open = expanded === id;
              return (
                <Fragment key={id}>
                  <tr
                    className="border-t cursor-pointer"
                    style={{
                      borderColor: 'var(--border-primary)',
                      opacity: row.insufficientSamples ? 0.7 : 1,
                    }}
                    onClick={() => onExpand(open ? null : id)}
                  >
                    <td className="px-2 py-2">
                      <span className="font-medium">{row.label}</span>
                      {row.insufficientSamples ? (
                        <span
                          className="ml-2 rounded-full border px-2 py-0.5 text-[10px] uppercase"
                          style={{ borderColor: 'var(--border-primary)' }}
                        >
                          low n
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {row.score == null ? '—' : row.score.toFixed(1)}
                    </td>
                    <td className="px-2 py-2 tabular-nums">{row.requests}</td>
                    <td className="px-2 py-2 tabular-nums">
                      {fmtPct(row.successRate)}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {fmtMs(row.ttftP50Ms)}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {fmtNum(row.tokensPerSecP50)}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {fmtUsd(row.totalCostUsd)}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {fmtUsd(row.costPer1kOutput)}
                    </td>
                  </tr>
                  {open ? (
                    <tr className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <td colSpan={8} className="px-4 py-3 text-xs">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <Detail k="TTFT p95" v={fmtMs(row.ttftP95Ms)} />
                          <Detail k="Latency p50 / p95" v={`${fmtMs(row.latencyP50Ms)} / ${fmtMs(row.latencyP95Ms)}`} />
                          <Detail k="TTFB p50" v={fmtMs(row.ttfbP50Ms)} />
                          <Detail k="Errors / rate limits" v={`${row.errorCount} / ${row.rateLimitCount}`} />
                          <Detail k="Prompt / completion tokens" v={`${row.promptTokens} / ${row.completionTokens}`} />
                          <Detail k="Cached / reasoning tokens" v={`${row.cachedTokens} / ${row.reasoningTokens}`} />
                          <Detail k="Avg cost" v={fmtUsd(row.avgCostUsd)} />
                          <Detail k="Sample size" v={String(row.sampleCount)} />
                          <Detail
                            k="Last seen"
                            v={
                              row.lastSeen
                                ? new Date(row.lastSeen).toLocaleString()
                                : '—'
                            }
                          />
                          {row.scoreComponents ? (
                            <Detail
                              k="Score parts"
                              v={`R ${row.scoreComponents.reliability} · T ${row.scoreComponents.ttft} · P ${row.scoreComponents.throughput} · C ${row.scoreComponents.cost}`}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span style={{ color: 'var(--text-secondary)' }}>{k}: </span>
      <span className="tabular-nums font-medium">{v}</span>
    </div>
  );
}
