"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

export function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return Math.round(n).toLocaleString();
}

/** Rounds a max value up to a "nice" axis ceiling (1, 2, 2.5, 5 × 10^n). */
function niceCeil(v: number): number {
  if (v <= 4) return 4;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/** Monotone cubic interpolation — smooth without overshooting the data. */
function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  if (n === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    dy[i] = pts[i + 1][1] - pts[i][1];
    m[i] = dy[i] / (dx[i] || 1);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else t[i] = (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  t[n - 1] = m[n - 2];

  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(pts[i][0] + h).toFixed(2)},${(pts[i][1] + h * t[i]).toFixed(2)} ${(pts[i + 1][0] - h).toFixed(2)},${(
      pts[i + 1][1] -
      h * t[i + 1]
    ).toFixed(2)} ${pts[i + 1][0].toFixed(2)},${pts[i + 1][1].toFixed(2)}`;
  }
  return d;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function ChartTooltip({
  x,
  containerWidth,
  children,
}: {
  x: number;
  containerWidth: number;
  children: React.ReactNode;
}) {
  // Keep the tooltip inside the plot: flip anchor near the edges
  const anchor = x < 110 ? "0%" : x > containerWidth - 110 ? "-100%" : "-50%";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, left: x }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.18, ease: EASE, left: { type: "spring", stiffness: 500, damping: 40 } }}
      className="pointer-events-none absolute top-0 z-20 min-w-[148px] rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 text-xs shadow-[0_12px_32px_-12px_rgba(15,23,42,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95"
      style={{ translateX: anchor }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Area / Line chart — multi-series, crosshair, keyboard navigable
   ═══════════════════════════════════════════════════════════════ */

export interface AreaSeries {
  key: string;
  label: string;
  color: string; // any CSS color, e.g. var(--chart-1)
  data: number[];
  dashed?: boolean;
  fill?: boolean;
}

export function AreaChart({
  series,
  labels,
  height = 260,
  formatLabel = (l) => l,
  formatTooltipLabel,
  valueFormatter = (n) => n.toLocaleString(),
  ariaLabel,
}: {
  series: AreaSeries[];
  labels: string[];
  height?: number;
  formatLabel?: (l: string) => string;
  formatTooltipLabel?: (l: string) => string;
  valueFormatter?: (n: number) => string;
  ariaLabel: string;
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const padL = 36;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;
  const count = labels.length;

  const max = useMemo(() => niceCeil(Math.max(1, ...series.flatMap((s) => s.data))), [series]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);

  const x = useCallback((i: number) => padL + (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW), [count, plotW]);
  const y = useCallback((v: number) => padT + (1 - v / max) * plotH, [max, plotH]);

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
        const line = monotonePath(pts);
        const area = pts.length > 1 ? `${line}L${x(pts.length - 1)},${padT + plotH}L${x(0)},${padT + plotH}Z` : "";
        return { line, area };
      }),
    [series, x, y, plotH]
  );

  // x-axis label sampling (max ~7 labels)
  const labelIdx = useMemo(() => {
    if (count === 0) return [];
    const n = Math.min(7, count);
    if (n === 1) return [0];
    return Array.from({ length: n }, (_, k) => Math.round((k * (count - 1)) / (n - 1)));
  }, [count]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - padL;
    if (count === 0) return;
    const idx = Math.round((px / Math.max(plotW, 1)) * (count - 1));
    setActive(Math.max(0, Math.min(count - 1, idx)));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (count === 0) return;
    if (e.key === "ArrowRight") setActive((a) => Math.min(count - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? count) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const drawKey = `${count}-${max}`;

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded-lg"
      style={{ height }}
      onPointerMove={onMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
      tabIndex={0}
      role="img"
      aria-label={`${ariaLabel}. Use left and right arrow keys to inspect values.`}
    >
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible">
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
            <clipPath id={`${uid}-clip`}>
              <motion.rect
                x={0}
                y={0}
                height={height}
                initial={{ width: reduce ? width : 0 }}
                animate={{ width }}
                transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
                key={drawKey}
              />
            </clipPath>
          </defs>

          {/* grid + y axis */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--chart-grid)"
                strokeDasharray={i === 0 ? undefined : "3 4"}
              />
              <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--chart-axis)] text-[10.5px] font-medium tabular">
                {compact(t)}
              </text>
            </g>
          ))}

          {/* series */}
          <g clipPath={`url(#${uid}-clip)`}>
            {series.map((s, si) =>
              s.fill !== false && !s.dashed ? (
                <motion.path
                  key={`a-${s.key}`}
                  d={paths[si].area}
                  fill={`url(#${uid}-${s.key})`}
                  initial={false}
                  animate={{ d: paths[si].area }}
                  transition={{ duration: 0.6, ease: EASE }}
                />
              ) : null
            )}
            {series.map((s, si) => (
              <motion.path
                key={`l-${s.key}`}
                d={paths[si].line}
                fill="none"
                stroke={s.color}
                strokeWidth={s.dashed ? 1.5 : 2.25}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={s.dashed ? 0.7 : 1}
                initial={false}
                animate={{ d: paths[si].line }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            ))}
          </g>

          {/* x labels */}
          {labelIdx.map((i, k) => (
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor={k === 0 && count > 1 ? "start" : k === labelIdx.length - 1 && count > 1 ? "end" : "middle"}
              className="fill-[var(--chart-axis)] text-[10.5px] font-medium"
            >
              {formatLabel(labels[i])}
            </text>
          ))}

          {/* crosshair */}
          {active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={padT} y2={padT + plotH} stroke="var(--chart-axis)" strokeOpacity={0.45} strokeDasharray="3 3" />
              {series.map((s) => (
                <motion.circle
                  key={s.key}
                  cx={x(active)}
                  cy={y(s.data[active] ?? 0)}
                  initial={{ r: 0, cx: x(active), cy: y(s.data[active] ?? 0) }}
                  animate={{ r: s.dashed ? 3 : 4.5, cx: x(active), cy: y(s.data[active] ?? 0) }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  fill={s.dashed ? "var(--chart-axis)" : s.color}
                  stroke="white"
                  strokeWidth={2}
                  className="dark:stroke-slate-900"
                />
              ))}
            </g>
          )}
        </svg>
      )}

      <AnimatePresence>
        {active !== null && labels[active] !== undefined && (
          <ChartTooltip x={x(active)} containerWidth={width}>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {(formatTooltipLabel || formatLabel)(labels[active])}
            </div>
            <div className="space-y-1">
              {series.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.dashed ? "var(--chart-axis)" : s.color }}
                    />
                    {s.label}
                  </span>
                  <span className="font-semibold text-slate-900 tabular dark:text-white">{valueFormatter(s.data[active] ?? 0)}</span>
                </div>
              ))}
            </div>
          </ChartTooltip>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Column chart — animated bars that grow from the baseline
   ═══════════════════════════════════════════════════════════════ */

export function ColumnChart({
  data,
  labels,
  height = 160,
  color = "var(--chart-1)",
  highlightIndex,
  formatLabel = (l) => l,
  valueFormatter = (n) => n.toLocaleString(),
  tickEvery,
  ariaLabel,
  stackData,
  stackColor = "var(--chart-2)",
  seriesLabels,
}: {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  highlightIndex?: number;
  formatLabel?: (l: string) => string;
  valueFormatter?: (n: number) => string;
  tickEvery?: number;
  ariaLabel: string;
  stackData?: number[];
  stackColor?: string;
  seriesLabels?: [string, string];
}) {
  const reduce = useReducedMotion();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const padB = 22;
  const plotH = height - padB;
  const totals = data.map((v, i) => v + (stackData?.[i] ?? 0));
  const max = Math.max(1, ...totals);
  const n = data.length;
  const gap = n > 40 ? 1.5 : n > 20 ? 3 : 6;
  const barW = n > 0 ? Math.max(1, (width - gap * (n - 1)) / n) : 0;
  const every = tickEvery ?? Math.max(1, Math.ceil(n / 6));

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ height }}
      onPointerLeave={() => setActive(null)}
      role="img"
      aria-label={ariaLabel}
    >
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible">
          {data.map((v, i) => {
            const bx = i * (barW + gap);
            const h1 = (v / max) * plotH;
            const h2 = ((stackData?.[i] ?? 0) / max) * plotH;
            const isHi = highlightIndex === i;
            const dim = active !== null && active !== i;
            return (
              <g key={i} onPointerEnter={() => setActive(i)} className="cursor-pointer">
                <rect x={bx} y={0} width={barW} height={plotH} fill="transparent" />
                <rect x={bx} y={0} width={barW} height={plotH} rx={Math.min(4, barW / 2)} fill="var(--chart-grid)" opacity={active === i ? 1 : 0} />
                <motion.rect
                  x={bx}
                  width={barW}
                  rx={Math.min(4, barW / 2)}
                  fill={isHi ? "var(--chart-3)" : color}
                  initial={reduce ? false : { height: 0, y: plotH }}
                  animate={{ height: Math.max(h1, v > 0 ? 2 : 0), y: plotH - Math.max(h1, v > 0 ? 2 : 0), opacity: dim ? 0.35 : 1 }}
                  transition={{ duration: 0.7, ease: EASE, delay: reduce ? 0 : Math.min(i * 0.012, 0.4) }}
                />
                {stackData && h2 > 0 && (
                  <motion.rect
                    x={bx}
                    width={barW}
                    rx={Math.min(4, barW / 2)}
                    fill={stackColor}
                    initial={reduce ? false : { height: 0, y: plotH - h1 }}
                    animate={{ height: h2, y: plotH - h1 - h2 - (h1 > 0 ? 1.5 : 0), opacity: dim ? 0.35 : 1 }}
                    transition={{ duration: 0.7, ease: EASE, delay: reduce ? 0 : Math.min(i * 0.012, 0.4) + 0.08 }}
                  />
                )}
              </g>
            );
          })}
          {labels.map((l, i) =>
            i % every === 0 || i === n - 1 ? (
              <text
                key={i}
                x={i * (barW + gap) + barW / 2}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                className="fill-[var(--chart-axis)] text-[10px] font-medium"
              >
                {formatLabel(l)}
              </text>
            ) : null
          )}
        </svg>
      )}
      <AnimatePresence>
        {active !== null && (
          <ChartTooltip x={active * (barW + gap) + barW / 2} containerWidth={width}>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{formatLabel(labels[active])}</div>
            {stackData && seriesLabels ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    {seriesLabels[0]}
                  </span>
                  <span className="font-semibold tabular text-slate-900 dark:text-white">{valueFormatter(data[active])}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: stackColor }} />
                    {seriesLabels[1]}
                  </span>
                  <span className="font-semibold tabular text-slate-900 dark:text-white">{valueFormatter(stackData[active] ?? 0)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm font-semibold tabular text-slate-900 dark:text-white">{valueFormatter(data[active])}</div>
            )}
          </ChartTooltip>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Donut — even gaps, rounded ends, segments morph on data change
   ═══════════════════════════════════════════════════════════════ */

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function Donut({
  segments,
  size = 168,
  thickness = 16,
  centerLabel,
  centerValue,
  valueFormatter = (n) => n.toLocaleString(),
  activeKey,
  onActiveChange,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel: string;
  centerValue: string;
  valueFormatter?: (n: number) => string;
  activeKey?: string | null;
  onActiveChange?: (key: string | null) => void;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const current = activeKey !== undefined ? activeKey : hover;
  const setCurrent = (k: string | null) => {
    setHover(k);
    onActiveChange?.(k);
  };
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  const gapLen = visible.length > 1 ? 4 : 0; // visible gap in px between segments

  let acc = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = Math.max(0, frac * C - (s.value > 0 ? gapLen : 0));
    const offset = acc;
    acc += frac * C;
    return { ...s, len, offset };
  });

  const hovered = segments.find((s) => s.key === current);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={thickness} />
        {arcs.map((a, i) => (
          <motion.circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={current === a.key ? thickness + 4 : thickness}
            strokeLinecap={a.len > thickness ? "round" : "butt"}
            initial={reduce ? false : { strokeDasharray: `0 ${C}`, strokeDashoffset: -a.offset }}
            animate={{
              // Round caps add thickness/2 at each end, so shorten the dash to keep the gaps even
              strokeDasharray: `${a.len > thickness ? a.len - thickness : a.len} ${C}`,
              strokeDashoffset: -(a.offset + (a.len > thickness ? thickness / 2 : 0)),
              opacity: current && current !== a.key ? 0.25 : 1,
            }}
            transition={{ duration: 0.9, ease: EASE, delay: reduce ? 0 : 0.1 + i * 0.08 }}
            onPointerEnter={() => setCurrent(a.key)}
            onPointerLeave={() => setCurrent(null)}
            className="cursor-pointer"
            style={{ transition: "stroke-width 200ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={hovered?.key ?? "total"}
            initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
            transition={{ duration: 0.18 }}
          >
            <div className="text-2xl font-semibold tracking-tight text-slate-900 tabular dark:text-white">
              {hovered ? valueFormatter(hovered.value) : centerValue}
            </div>
            <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-wider text-slate-400">
              {hovered ? hovered.label : centerLabel}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sparkline — tiny, draws itself in
   ═══════════════════════════════════════════════════════════════ */

export function Sparkline({
  data,
  color = "var(--chart-1)",
  height = 40,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const [ref, width] = useWidth<HTMLDivElement>();
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [data.length <= 1 ? width / 2 : (i / (data.length - 1)) * width, 3 + (1 - v / max) * (height - 6)] as [number, number]);
  const line = monotonePath(pts);
  const area = pts.length > 1 ? `${line}L${width},${height}L0,${height}Z` : "";
  return (
    <div ref={ref} className={cn("w-full", className)} style={{ height }} aria-hidden="true">
      {width > 0 && data.length > 1 && (
        <svg width={width} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={`${uid}-sg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill={`url(#${uid}-sg)`}
            initial={reduce ? false : { opacity: 0, d: area }}
            animate={{ opacity: 1, d: area }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0, d: line }}
            animate={{ pathLength: 1, d: line }}
            transition={{ duration: 1.1, ease: EASE }}
          />
        </svg>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Bar list — ranked rows with animated fills (Tremor-style)
   ═══════════════════════════════════════════════════════════════ */

export function BarList({
  items,
  valueFormatter = (n) => n.toLocaleString(),
  color = "var(--chart-1)",
}: {
  items: { key: string; label: React.ReactNode; value: number; icon?: React.ReactNode; meta?: React.ReactNode }[];
  valueFormatter?: (n: number) => string;
  color?: string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => {
        const pct = (item.value / max) * 100;
        return (
          <li key={item.key} className="group relative flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-1 left-0 rounded-md"
              style={{ background: color, opacity: 0.1 }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${Math.max(pct, item.value > 0 ? 2 : 0)}%` }}
              transition={{ duration: 0.9, ease: EASE, delay: reduce ? 0 : idx * 0.05 }}
            />
            <span className="relative flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="relative flex shrink-0 items-center gap-2.5">
              {item.meta}
              <span className="min-w-[2.5rem] text-right text-[13px] font-semibold tabular text-slate-900 dark:text-white">
                {valueFormatter(item.value)}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Radial gauge — semicircle progress (rating, conversion)
   ═══════════════════════════════════════════════════════════════ */

export function RadialGauge({
  value,
  max = 100,
  size = 180,
  thickness = 14,
  color = "var(--chart-1)",
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const r = (size - thickness) / 2;
  const half = Math.PI * r;
  const frac = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const h = size / 2 + thickness / 2;
  const d = `M ${thickness / 2},${size / 2} A ${r},${r} 0 0 1 ${size - thickness / 2},${size / 2}`;
  return (
    <div className="relative" style={{ width: size, height: h }}>
      <svg width={size} height={h} className="overflow-visible">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="var(--chart-grid)" strokeWidth={thickness} strokeLinecap="round" />
        <motion.path
          d={d}
          fill="none"
          stroke={`url(#${uid}-g)`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={half}
          initial={reduce ? false : { strokeDashoffset: half }}
          animate={{ strokeDashoffset: half * (1 - frac) }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Heat grid — rows × columns intensity matrix
   ═══════════════════════════════════════════════════════════════ */

export function HeatGrid({
  matrix,
  rowLabels,
  colLabels,
  levels = 4,
  describe,
}: {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  levels?: number;
  describe: (row: number, col: number, value: number) => string;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<[number, number] | null>(null);
  const maxV = Math.max(1, ...matrix.flat());
  const opacityFor = (v: number) => (v <= 0 ? 0 : 0.18 + (Math.min(v, maxV) / maxV) * 0.82);

  return (
    <div className="w-full">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `4.5rem repeat(${colLabels.length}, minmax(0, 1fr))` }}>
        <span />
        {colLabels.map((c) => (
          <span key={c} className="text-center text-[10.5px] font-medium text-slate-400">
            {c}
          </span>
        ))}
        {matrix.map((row, ri) => (
          <React.Fragment key={ri}>
            <span className="flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">{rowLabels[ri]}</span>
            {row.map((v, ci) => {
              const isHover = hover?.[0] === ri && hover?.[1] === ci;
              return (
                <motion.button
                  type="button"
                  key={ci}
                  aria-label={describe(ri, ci, v)}
                  title={describe(ri, ci, v)}
                  onPointerEnter={() => setHover([ri, ci])}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover([ri, ci])}
                  onBlur={() => setHover(null)}
                  initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: isHover ? 1.08 : 1 }}
                  transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : (ri * row.length + ci) * 0.012 }}
                  className="relative h-8 rounded-md bg-slate-100 dark:bg-white/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                >
                  <span
                    className="absolute inset-0 rounded-md"
                    style={{ background: "var(--chart-1)", opacity: opacityFor(v) }}
                  />
                </motion.button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex h-4 items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={hover ? `${hover[0]}-${hover[1]}` : "none"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="font-medium"
          >
            {hover ? describe(hover[0], hover[1], matrix[hover[0]][hover[1]]) : "Hover a cell for details"}
          </motion.span>
        </AnimatePresence>
        <span className="flex items-center gap-1.5">
          Less
          {Array.from({ length: levels }, (_, i) => (
            <span key={i} className="relative h-2.5 w-2.5 rounded-[3px] bg-slate-100 dark:bg-white/[0.04]">
              <span className="absolute inset-0 rounded-[3px]" style={{ background: "var(--chart-1)", opacity: 0.18 + (i / (levels - 1)) * 0.82 }} />
            </span>
          ))}
          More
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Funnel — stepped stages with drop-off between them
   ═══════════════════════════════════════════════════════════════ */

export function Funnel({
  stages,
  color = "var(--chart-1)",
}: {
  stages: { label: string; count: number }[];
  color?: string;
}) {
  const reduce = useReducedMotion();
  const base = Math.max(1, stages[0]?.count ?? 1);
  return (
    <ol className="space-y-2">
      {stages.map((s, i) => {
        const pct = Math.round((s.count / base) * 100);
        const prev = i > 0 ? stages[i - 1].count : null;
        const step = prev !== null && prev > 0 ? Math.round((s.count / prev) * 100) : null;
        return (
          <li key={s.label}>
            {step !== null && (
              <div className="flex items-center gap-2 py-0.5 pl-3 text-[10.5px] font-medium text-slate-400">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                  <path d="M5 0v8M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </svg>
                {step}% continued
              </div>
            )}
            <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/60 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <motion.div
                aria-hidden="true"
                className="absolute inset-y-0 left-0"
                style={{ background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 55%, transparent))`, opacity: 0.16 }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${Math.max(pct, s.count > 0 ? 3 : 0)}%` }}
                transition={{ duration: 1, ease: EASE, delay: reduce ? 0 : i * 0.12 }}
              />
              <div className="relative flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="flex items-center gap-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/10">
                    {i + 1}
                  </span>
                  {s.label}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold tabular text-slate-900 dark:text-white">{s.count.toLocaleString()}</span>
                  <span className="w-10 text-right text-[11px] font-medium tabular text-slate-400">{pct}%</span>
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Legend
   ═══════════════════════════════════════════════════════════════ */

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {it.dashed ? (
            <span className="w-3.5 border-t-[1.5px] border-dashed" style={{ borderColor: it.color }} />
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}
