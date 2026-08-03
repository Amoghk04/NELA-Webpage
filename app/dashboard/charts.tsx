'use client';

import { useId, useMemo } from 'react';

const ACCENT = 'var(--accent)';
const MUTED = 'var(--text-tertiary)';
const GRID = 'var(--border-primary)';
const SECONDARY = 'var(--text-secondary)';

export type SeriesPoint = { label: string; value: number };
export type MultiSeriesPoint = { label: string; a: number; b: number };

function ChartFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
    >
      <div className="mb-3">
        <h3 className="font-space text-sm font-semibold">{title}</h3>
        {subtitle ? (
          <p className="text-xs" style={{ color: SECONDARY }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Vertical bar chart (SVG). */
export function BarChart({
  title,
  subtitle,
  data,
  formatValue = (n) => String(Math.round(n)),
  color = ACCENT,
}: {
  title: string;
  subtitle?: string;
  data: SeriesPoint[];
  formatValue?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 420;
  const h = 160;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const gap = 3;
  const barW = data.length > 0 ? (innerW - gap * (data.length - 1)) / data.length : 0;

  return (
    <ChartFrame title={title} subtitle={subtitle}>
      {data.every((d) => d.value === 0) ? (
        <EmptyState />
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img">
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={padL}
                x2={w - padR}
                y1={y}
                y2={y}
                stroke={GRID}
                strokeWidth={1}
                opacity={0.6}
              />
            );
          })}
          {data.map((d, i) => {
            const bh = (d.value / max) * innerH;
            const x = padL + i * (barW + gap);
            const y = padT + innerH - bh;
            const showLabel = data.length <= 14 || i % 2 === 0;
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(1, barW)}
                  height={Math.max(0, bh)}
                  rx={2}
                  fill={color}
                  opacity={0.85}
                >
                  <title>
                    {d.label}: {formatValue(d.value)}
                  </title>
                </rect>
                {showLabel ? (
                  <text
                    x={x + barW / 2}
                    y={h - 8}
                    textAnchor="middle"
                    fontSize={9}
                    fill="currentColor"
                    opacity={0.55}
                  >
                    {d.label.slice(5)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
      {!data.every((d) => d.value === 0) ? (
        <p className="mt-1 text-xs" style={{ color: MUTED }}>
          Peak {formatValue(max)}
        </p>
      ) : null}
    </ChartFrame>
  );
}

/** Dual-series grouped bars (e.g. granted vs burned). */
export function DualBarChart({
  title,
  subtitle,
  data,
  aLabel,
  bLabel,
  formatValue = (n) => String(Math.round(n)),
}: {
  title: string;
  subtitle?: string;
  data: MultiSeriesPoint[];
  aLabel: string;
  bLabel: string;
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  const w = 420;
  const h = 170;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const gap = 4;
  const groupW = data.length > 0 ? (innerW - gap * (data.length - 1)) / data.length : 0;
  const barW = groupW / 2 - 1;

  return (
    <ChartFrame title={title} subtitle={subtitle}>
      {data.every((d) => d.a === 0 && d.b === 0) ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-2 flex gap-4 text-xs" style={{ color: SECONDARY }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: ACCENT }} />
              {aLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: 'var(--text-secondary)', opacity: 0.55 }}
              />
              {bLabel}
            </span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full" role="img">
            {data.map((d, i) => {
              const x0 = padL + i * (groupW + gap);
              const ah = (d.a / max) * innerH;
              const bh = (d.b / max) * innerH;
              const showLabel = data.length <= 14 || i % 2 === 0;
              return (
                <g key={d.label}>
                  <rect
                    x={x0}
                    y={padT + innerH - ah}
                    width={Math.max(1, barW)}
                    height={Math.max(0, ah)}
                    rx={2}
                    fill={ACCENT}
                    opacity={0.9}
                  >
                    <title>
                      {d.label} {aLabel}: {formatValue(d.a)}
                    </title>
                  </rect>
                  <rect
                    x={x0 + barW + 2}
                    y={padT + innerH - bh}
                    width={Math.max(1, barW)}
                    height={Math.max(0, bh)}
                    rx={2}
                    fill="currentColor"
                    opacity={0.35}
                  >
                    <title>
                      {d.label} {bLabel}: {formatValue(d.b)}
                    </title>
                  </rect>
                  {showLabel ? (
                    <text
                      x={x0 + groupW / 2}
                      y={h - 10}
                      textAnchor="middle"
                      fontSize={9}
                      fill="currentColor"
                      opacity={0.55}
                    >
                      {d.label.slice(5)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </>
      )}
    </ChartFrame>
  );
}

/** Smooth-ish area/line chart. */
export function AreaChart({
  title,
  subtitle,
  data,
  formatValue = (n) => n.toFixed(2),
}: {
  title: string;
  subtitle?: string;
  data: SeriesPoint[];
  formatValue?: (n: number) => string;
}) {
  const gradId = useId().replace(/:/g, '');
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 420;
  const h = 160;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const coords = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, i) => {
      const x =
        padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = padT + innerH * (1 - d.value / max);
      return { x, y, ...d };
    });
  }, [data, innerH, innerW, max, padL, padT]);

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const area =
    coords.length > 0
      ? `${line} L${coords[coords.length - 1]!.x},${padT + innerH} L${coords[0]!.x},${padT + innerH} Z`
      : '';

  return (
    <ChartFrame title={title} subtitle={subtitle}>
      {data.every((d) => d.value === 0) ? (
        <EmptyState />
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" role="img">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
          <path d={line} fill="none" stroke={ACCENT} strokeWidth={2} />
          {coords.map((c) => (
            <circle key={c.label} cx={c.x} cy={c.y} r={2.5} fill={ACCENT}>
              <title>
                {c.label}: {formatValue(c.value)}
              </title>
            </circle>
          ))}
        </svg>
      )}
    </ChartFrame>
  );
}

const DONUT_COLORS = [
  'var(--accent)',
  'color-mix(in srgb, var(--accent) 55%, var(--text-primary))',
  'color-mix(in srgb, var(--accent) 30%, var(--text-secondary))',
  'var(--text-tertiary)',
  'color-mix(in srgb, var(--border-primary) 80%, var(--accent))',
];

/** Donut chart with legend. */
export function DonutChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: SeriesPoint[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 70;
  const cy = 70;
  const r = 52;
  const stroke = 18;

  let angle = -Math.PI / 2;
  const arcs =
    total <= 0
      ? []
      : data.map((d, i) => {
          const sweep = (d.value / total) * Math.PI * 2;
          const start = angle;
          angle += sweep;
          const end = angle;
          const large = sweep > Math.PI ? 1 : 0;
          const x1 = cx + r * Math.cos(start);
          const y1 = cy + r * Math.sin(start);
          const x2 = cx + r * Math.cos(end);
          const y2 = cy + r * Math.sin(end);
          return {
            ...d,
            path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
            color: DONUT_COLORS[i % DONUT_COLORS.length]!,
          };
        });

  return (
    <ChartFrame title={title} subtitle={subtitle}>
      {total <= 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={GRID}
              strokeWidth={stroke}
              opacity={0.35}
            />
            {arcs.map((a) => (
              <path
                key={a.label}
                d={a.path}
                fill="none"
                stroke={a.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
              >
                <title>
                  {a.label}: {a.value} ({((a.value / total) * 100).toFixed(0)}%)
                </title>
              </path>
            ))}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize={16}
              fontWeight={700}
              fill="currentColor"
            >
              {total}
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              opacity={0.55}
            >
              total
            </text>
          </svg>
          <ul className="min-w-[8rem] space-y-1.5 text-sm">
            {arcs.map((a) => (
              <li key={a.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: a.color }}
                />
                <span className="capitalize" style={{ color: SECONDARY }}>
                  {a.label}
                </span>
                <span className="ml-auto font-medium tabular-nums">{a.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartFrame>
  );
}

/** Horizontal progress comparing two totals. */
export function BreakageGauge({
  granted,
  burned,
}: {
  granted: number;
  burned: number;
}) {
  const breakage =
    granted > 0 ? Math.max(0, Math.min(100, (1 - burned / granted) * 100)) : null;
  const usedPct =
    granted > 0 ? Math.max(0, Math.min(100, (burned / granted) * 100)) : 0;

  return (
    <ChartFrame
      title="Credit utilization (7d)"
      subtitle={
        breakage == null
          ? 'No grants in window'
          : `${breakage.toFixed(0)}% breakage · ${usedPct.toFixed(0)}% burned`
      }
    >
      <div
        className="h-3 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${usedPct}%`,
            background: ACCENT,
          }}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs" style={{ color: SECONDARY }}>
        <span>Burned {burned.toLocaleString()}</span>
        <span>Granted {granted.toLocaleString()}</span>
      </div>
    </ChartFrame>
  );
}

function EmptyState() {
  return (
    <div
      className="flex h-40 items-center justify-center text-sm"
      style={{ color: MUTED }}
    >
      No data in this window yet
    </div>
  );
}
