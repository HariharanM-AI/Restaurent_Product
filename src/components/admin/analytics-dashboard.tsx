"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import {
  Users,
  Eye,
  UtensilsCrossed,
  Star,
  Wifi,
  MessageSquare,
  Award,
  Gamepad2,
  Share2,
  QrCode,
  Radio,
  ExternalLink,
  TrendingUp,
  Gift,
  AlertCircle,
  Zap,
  Clock,
  BarChart3,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  RotateCw,
  MousePointerClick,
} from "lucide-react";
import { Stagger } from "@/components/ui/motion";
import { AreaChart, ColumnChart, Donut, Legend, compact } from "@/components/charts";
import {
  DashboardSkeleton,
  Delta,
  KpiTile,
  PERIOD_LONG,
  Panel,
  PanelEmpty,
  PeriodToolbar,
  longDate,
  shortDate,
  type PeriodKey,
} from "@/components/admin/dashboard-kit";

/* ─── Types ─── */
interface AnalyticsAPIData {
  period: string;
  kpis: {
    totalVisits: { current: number; change: number };
    uniqueGuests: { current: number; change: number };
    totalInteractions: { current: number; change: number };
    conversionRate: { current: number; change: number };
  };
  funnel: {
    eventType: string;
    label: string;
    icon: string;
    color: string;
    count: number;
    prevCount: number;
    change: number;
    pct: number;
  }[];
  touchpoints: {
    qr: { count: number; pct: number; change: number };
    nfc: { count: number; pct: number; change: number };
    direct: { count: number; pct: number; change: number };
  };
  timeSeries: { date: string; visits: number; interactions: number }[];
  insights: {
    topFeature: { label: string; count: number } | null;
    leastUsed: { label: string; count: number } | null;
    peakHour: number;
    peakHourLabel: string;
  };
  hourlyDistribution: number[];
}

interface AnalyticsDashboardProps {
  restaurantId: string;
}

const iconMap: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Star,
  Wifi,
  MessageSquare,
  Award,
  Gift,
  Gamepad2,
  Share2,
};

/* Feature tint → chart token, keeping the palette restrained */
const tintMap: Record<string, string> = {
  teal: "var(--chart-1)",
  emerald: "var(--chart-1)",
  green: "var(--chart-2)",
  amber: "var(--chart-3)",
  sky: "var(--chart-4)",
  blue: "var(--chart-4)",
  indigo: "var(--chart-4)",
  purple: "var(--chart-4)",
  rose: "var(--chart-5)",
};

/* ─── Main Component ─── */
export function AnalyticsDashboard({ restaurantId }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<AnalyticsAPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);
    try {
      let url = `/api/restaurants/${restaurantId}/analytics?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      if (json.success) setData(json.data);
      else {
        if (!isSilent) setError(json.error || "Unknown error");
      }
    } catch {
      if (!isSilent) setError("Unable to load analytics data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [restaurantId, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchData();
  }, [fetchData, period, customFrom, customTo]);

  // Live refresh: 30s polling + realtime events, paused while hidden, never overlapping
  useLiveRefresh(restaurantId, () => fetchData(true));

  return (
    <div className="w-full space-y-5 pb-12">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          {loading && !data ? "Loading analytics…" : (
            <>
              <span className="font-medium text-slate-700 dark:text-slate-200">{PERIOD_LONG[period]}</span> · compared with the previous period
            </>
          )}
        </p>
        <PeriodToolbar
          layoutId="analytics-period"
          period={period}
          onPeriod={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFrom={setCustomFrom}
          onCustomTo={setCustomTo}
          loading={loading}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => fetchData()}
              className="pressable ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-800"
            >
              <RotateCw className="h-3 w-3" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && !data && <DashboardSkeleton />}

      {data && (
        <Stagger className="space-y-4 sm:space-y-5" stagger={0.05}>
          {/* KPI tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              featured
              label="Total visits"
              value={data.kpis.totalVisits.current}
              format={compact}
              delta={data.kpis.totalVisits.change}
              icon={<Eye className="h-4 w-4" />}
              spark={data.timeSeries.map((d) => d.visits)}
            />
            <KpiTile
              label="Unique guests"
              value={data.kpis.uniqueGuests.current}
              format={compact}
              delta={data.kpis.uniqueGuests.change}
              icon={<Users className="h-4 w-4" />}
            />
            <KpiTile
              label="Feature interactions"
              value={data.kpis.totalInteractions.current}
              format={compact}
              delta={data.kpis.totalInteractions.change}
              icon={<Zap className="h-4 w-4" />}
              spark={data.timeSeries.map((d) => d.interactions)}
              color="var(--chart-3)"
            />
            <KpiTile
              label="Conversion rate"
              value={data.kpis.conversionRate.current}
              format={(n) => `${Math.round(n)}%`}
              delta={data.kpis.conversionRate.change}
              deltaSuffix="pts"
              icon={<TrendingUp className="h-4 w-4" />}
              hint="Interactions per visit"
            />
          </div>

          {/* Trend + insights */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
            <TrendsPanel timeSeries={data.timeSeries} />
            <InsightsPanel insights={data.insights} />
          </div>

          {/* Feature funnel + touchpoints */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
            <FeatureEngagementPanel funnel={data.funnel} />
            <TouchpointPanel touchpoints={data.touchpoints} />
          </div>

          {/* Hourly */}
          <HourlyPanel hours={data.hourlyDistribution} peakHour={data.insights.peakHour} />
        </Stagger>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PANELS
   ═══════════════════════════════════════════════════ */

/* ─── Visits vs interactions ─── */
function TrendsPanel({ timeSeries }: { timeSeries: AnalyticsAPIData["timeSeries"] }) {
  const [mode, setMode] = useState<"area" | "bars">("area");
  const visits = timeSeries.map((d) => d.visits);
  const interactions = timeSeries.map((d) => d.interactions);
  const empty = visits.every((v) => v === 0) && interactions.every((v) => v === 0);

  return (
    <Panel
      className="xl:col-span-2"
      title="Visit & interaction trends"
      description="Daily hub visits against the feature interactions they produced."
      action={
        <div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-0.5 dark:bg-white/[0.05]" role="group" aria-label="Chart style">
          {(["area", "bars"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold capitalize transition-colors ${
                mode === m
                  ? "bg-white text-slate-900 shadow-sm dark:bg-white/[0.1] dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {m === "area" ? "Lines" : "Bars"}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-3">
        <Legend
          items={[
            { label: "Visits", color: "var(--chart-1)" },
            { label: "Interactions", color: "var(--chart-3)" },
          ]}
        />
      </div>
      {empty ? (
        <PanelEmpty icon={<BarChart3 className="h-4 w-4" />} title="No traffic in this period" hint="Try a wider date range, or share your QR codes to start collecting data." />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(3px)" }}
            transition={{ duration: 0.2 }}
          >
            {mode === "area" ? (
              <AreaChart
                ariaLabel="Daily visits and interactions"
                labels={timeSeries.map((d) => d.date)}
                formatLabel={shortDate}
                formatTooltipLabel={longDate}
                height={260}
                series={[
                  { key: "visits", label: "Visits", color: "var(--chart-1)", data: visits },
                  { key: "interactions", label: "Interactions", color: "var(--chart-3)", data: interactions },
                ]}
              />
            ) : (
              <ColumnChart
                ariaLabel="Daily visits and interactions, stacked"
                data={visits}
                stackData={interactions}
                seriesLabels={["Visits", "Interactions"]}
                stackColor="var(--chart-3)"
                labels={timeSeries.map((d) => d.date)}
                formatLabel={shortDate}
                height={260}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </Panel>
  );
}

/* ─── Operational insights ─── */
function InsightsPanel({ insights }: { insights: AnalyticsAPIData["insights"] }) {
  const rows = [
    insights.topFeature && {
      key: "top",
      tone: "text-teal-300",
      icon: Award,
      label: "Top feature",
      title: insights.topFeature.label,
      sub: `${insights.topFeature.count.toLocaleString()} interactions`,
    },
    insights.leastUsed &&
      insights.leastUsed.count > 0 && {
        key: "least",
        tone: "text-amber-300",
        icon: AlertTriangle,
        label: "Needs attention",
        title: insights.leastUsed.label,
        sub: `Only ${insights.leastUsed.count.toLocaleString()} interactions`,
      },
    {
      key: "peak",
      tone: "text-sky-300",
      icon: Clock,
      label: "Peak volume hour",
      title: insights.peakHourLabel,
      sub: "Highest guest traffic window",
    },
  ].filter(Boolean) as { key: string; tone: string; icon: React.ElementType; label: string; title: string; sub: string }[];

  return (
    <motion.section
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
      className="grain relative flex flex-col overflow-hidden rounded-2xl border border-teal-900/30 bg-[#0B2E2A] p-5 text-white shadow-panel sm:p-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl animate-aurora" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl animate-aurora [animation-delay:-6s]" />
      <div className="relative">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
          </span>
          Operational insights
        </h2>
        <p className="mt-1 text-[12.5px] text-teal-100/60">Calculated from this period&apos;s telemetry.</p>
      </div>
      <ul className="relative mt-5 space-y-2.5">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.li
              key={r.key}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 + i * 0.1 }}
              className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-inset ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.09]"
            >
              <div className={`flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider ${r.tone}`}>
                <Icon className="h-3.5 w-3.5" />
                {r.label}
              </div>
              <div className="mt-1 text-sm font-semibold">{r.title}</div>
              <div className="text-[12px] text-teal-100/60">{r.sub}</div>
            </motion.li>
          );
        })}
      </ul>
      <div className="relative mt-auto flex items-center gap-1.5 pt-5 text-[11px] text-teal-100/40">
        <ShieldCheck className="h-3.5 w-3.5" />
        Updates live as guests interact.
      </div>
    </motion.section>
  );
}

/* ─── Per-feature engagement ─── */
function FeatureEngagementPanel({ funnel }: { funnel: AnalyticsAPIData["funnel"] }) {
  const max = Math.max(1, ...funnel.map((f) => f.count));
  const anyData = funnel.some((f) => f.count > 0);
  return (
    <Panel
      className="xl:col-span-7"
      icon={<MousePointerClick className="h-4 w-4" />}
      title="Feature engagement"
      description="How many visitors went on to use each feature."
    >
      {!anyData ? (
        <PanelEmpty icon={<BarChart3 className="h-4 w-4" />} title="No feature interactions recorded in this period." />
      ) : (
        <div className="overflow-x-auto scroll-thin -mx-1">
          <table className="w-full min-w-[460px] border-separate border-spacing-y-1 px-1 text-[13px]">
            <thead>
              <tr className="text-left text-[11px] font-medium text-slate-400">
                <th className="pb-1 font-medium">Feature</th>
                <th className="pb-1 font-medium">Reach</th>
                <th className="pb-1 text-right font-medium">Count</th>
                <th className="pb-1 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((item, idx) => {
                const Icon = iconMap[item.icon] || BarChart3;
                const color = tintMap[item.color] || "var(--chart-1)";
                return (
                  <motion.tr
                    key={item.eventType}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="group"
                  >
                    <td className="rounded-l-lg py-2 pl-2 pr-3 transition-colors group-hover:bg-slate-50 dark:group-hover:bg-white/[0.03]">
                      <span className="flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-200">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-slate-200/80 dark:ring-white/[0.08]" style={{ color }}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                    </td>
                    <td className="w-[34%] py-2 pr-3 transition-colors group-hover:bg-slate-50 dark:group-hover:bg-white/[0.03]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.05]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max((item.count / max) * 100, item.count > 0 ? 3 : 0)}%` }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 + idx * 0.04 }}
                          />
                        </div>
                        <span className="w-9 text-right text-[11px] tabular text-slate-400">{item.pct}%</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold tabular text-slate-900 transition-colors group-hover:bg-slate-50 dark:text-white dark:group-hover:bg-white/[0.03]">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="rounded-r-lg py-2 pr-2 text-right transition-colors group-hover:bg-slate-50 dark:group-hover:bg-white/[0.03]">
                      <Delta value={item.change} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ─── Touchpoint distribution ─── */
function TouchpointPanel({ touchpoints }: { touchpoints: AnalyticsAPIData["touchpoints"] }) {
  const [active, setActive] = useState<string | null>(null);
  const items = [
    { key: "qr", label: "Table QR code", desc: "Physical tabletop stands", icon: QrCode, data: touchpoints.qr, color: "var(--chart-1)" },
    { key: "nfc", label: "NFC touchpoint", desc: "Tap-to-connect tags", icon: Radio, data: touchpoints.nfc, color: "var(--chart-4)" },
    { key: "direct", label: "Direct / online", desc: "Browser & shared links", icon: ExternalLink, data: touchpoints.direct, color: "var(--chart-3)" },
  ];
  const total = touchpoints.qr.count + touchpoints.nfc.count + touchpoints.direct.count;

  return (
    <Panel className="xl:col-span-5" title="Touchpoint distribution" description="Where guest sessions start.">
      <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
        <Donut
          size={156}
          thickness={15}
          centerLabel="Events"
          centerValue={compact(total)}
          activeKey={active}
          onActiveChange={setActive}
          segments={items.map((i) => ({ key: i.key, label: i.label, value: i.data.count, color: i.color }))}
        />
        <ul className="w-full flex-1 space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.key}
                onPointerEnter={() => setActive(item.key)}
                onPointerLeave={() => setActive(null)}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset transition-all duration-200 ${
                  active === item.key
                    ? "bg-slate-50 ring-slate-300/80 dark:bg-white/[0.05] dark:ring-white/15"
                    : "ring-slate-200/60 dark:ring-white/[0.06]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ color: item.color, background: `color-mix(in srgb, ${item.color} 12%, transparent)` }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                    <span className="block truncate text-[11px] text-slate-400">{item.desc}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular text-slate-900 dark:text-white">{item.data.count.toLocaleString()}</span>
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="text-[11px] tabular text-slate-400">{item.data.pct}%</span>
                    <Delta value={item.data.change} />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11.5px] text-slate-400 dark:border-white/[0.06]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Data is strictly anonymous. No guest personal identity is logged during table scans.
      </p>
    </Panel>
  );
}

/* ─── Hourly distribution ─── */
function HourlyPanel({ hours, peakHour }: { hours: number[]; peakHour: number }) {
  const timeSlots = [
    { label: "Morning", hint: "6–12", range: [6, 12], icon: Sunrise },
    { label: "Afternoon", hint: "12–17", range: [12, 17], icon: Sun },
    { label: "Evening", hint: "17–22", range: [17, 22], icon: Sunset },
    { label: "Night", hint: "22–6", range: [22, 6], icon: Moon },
  ];
  const totals = timeSlots.map((slot) => {
    const [start, end] = slot.range;
    return start < end
      ? hours.slice(start, end).reduce((a, b) => a + b, 0)
      : hours.slice(start).reduce((a, b) => a + b, 0) + hours.slice(0, end).reduce((a, b) => a + b, 0);
  });
  const best = Math.max(...totals);
  const hasData = hours.some((h) => h > 0);

  return (
    <Panel
      icon={<Clock className="h-4 w-4" />}
      title="Peak hours"
      description="Guest engagement distribution across the day."
      action={
        hasData ? (
          <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11.5px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            Peak {String(peakHour).padStart(2, "0")}:00
          </span>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ColumnChart
            ariaLabel="Interactions by hour of day"
            data={hours}
            labels={hours.map((_, h) => `${String(h).padStart(2, "0")}:00`)}
            highlightIndex={hasData ? peakHour : undefined}
            height={170}
            tickEvery={3}
            valueFormatter={(n) => `${n.toLocaleString()} events`}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
          {timeSlots.map((slot, i) => {
            const SlotIcon = slot.icon;
            const isBest = hasData && totals[i] === best;
            return (
              <div
                key={slot.label}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 ring-1 ring-inset transition-colors ${
                  isBest
                    ? "bg-amber-50/70 ring-amber-500/25 dark:bg-amber-400/[0.07] dark:ring-amber-400/20"
                    : "ring-slate-200/60 dark:ring-white/[0.06]"
                }`}
              >
                <span className="flex items-center gap-2 text-[12.5px] font-medium text-slate-700 dark:text-slate-200">
                  <SlotIcon className={`h-4 w-4 ${isBest ? "text-amber-600 dark:text-amber-300" : "text-slate-400"}`} />
                  {slot.label}
                  <span className="text-[10.5px] font-normal text-slate-400">{slot.hint}</span>
                </span>
                <span className="text-sm font-semibold tabular text-slate-900 dark:text-white">{totals[i].toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
