"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Calendar,
  Loader2,
  AlertCircle,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";

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

/* ─── Constants ─── */
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "1y", label: "1 Year" },
  { key: "custom", label: "Custom" },
] as const;

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

const colorMap: Record<string, { bg: string; bar: string; text: string }> = {
  teal: { bg: "bg-teal-50", bar: "bg-teal-600", text: "text-teal-700" },
  amber: { bg: "bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" },
  sky: { bg: "bg-sky-50", bar: "bg-sky-600", text: "text-sky-700" },
  blue: { bg: "bg-blue-50", bar: "bg-blue-600", text: "text-blue-700" },
  purple: { bg: "bg-purple-50", bar: "bg-purple-600", text: "text-purple-700" },
  emerald: { bg: "bg-emerald-50", bar: "bg-emerald-600", text: "text-emerald-700" },
  green: { bg: "bg-green-50", bar: "bg-green-600", text: "text-green-700" },
  indigo: { bg: "bg-indigo-50", bar: "bg-indigo-600", text: "text-indigo-700" },
  rose: { bg: "bg-rose-50", bar: "bg-rose-600", text: "text-rose-700" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString();
}

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-100 mb-3" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-7 w-16 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-100 rounded" />
    </div>
  );
}

/* ─── Change Badge ─── */
function ChangeBadge({ change, suffix = "%" }: { change: number; suffix?: string }) {
  if (change === 0) return <span className="text-[11px] text-slate-400 font-medium">No change</span>;
  const isPositive = change > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(change)}{suffix}
    </span>
  );
}

/* ─── Main Component ─── */
export function AnalyticsDashboard({ restaurantId }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [data, setData] = useState<AnalyticsAPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
      else setError(json.error || "Unknown error");
    } catch {
      setError("Unable to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchData();
  }, [fetchData, period, customFrom, customTo]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "30 Days";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-slate-500">
          {loading ? "Loading analytics..." : `Engagement data for ${periodLabel} — vs previous period`}
        </p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => { setPeriod(p.key); setShowCustom(p.key === "custom"); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === p.key
                ? "bg-[#0B3B36] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {p.key === "custom" && <Calendar className="w-3 h-3 inline mr-1.5 -mt-px" />}
            {p.label}
          </button>
        ))}
        {showCustom && period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
          </div>
        )}
        {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-2" />}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto text-xs font-bold underline">Retry</button>
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={<Eye className="w-5 h-5" />} iconBg="bg-indigo-50 text-indigo-600"
              label="Total Visits" value={fmt(data.kpis.totalVisits.current)} change={data.kpis.totalVisits.change} />
            <KPICard icon={<Users className="w-5 h-5" />} iconBg="bg-teal-50 text-teal-600"
              label="Unique Guests" value={fmt(data.kpis.uniqueGuests.current)} change={data.kpis.uniqueGuests.change} />
            <KPICard icon={<Zap className="w-5 h-5" />} iconBg="bg-orange-50 text-orange-600"
              label="Feature Interactions" value={fmt(data.kpis.totalInteractions.current)} change={data.kpis.totalInteractions.change} />
            <KPICard icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600"
              label="Conversion Rate" value={`${data.kpis.conversionRate.current}%`} change={data.kpis.conversionRate.change} suffix="pts" />
          </div>

          {/* Engagement Funnel + Touchpoint Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <EngagementFunnel funnel={data.funnel} totalVisits={data.kpis.totalVisits.current} />
            <TouchpointDistribution touchpoints={data.touchpoints} />
          </div>

          {/* Time Series + Hourly Heatmap + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <VisitTrendsChart timeSeries={data.timeSeries} />
            <HourlyHeatmap hours={data.hourlyDistribution} peakHour={data.insights.peakHour} />
            <InsightsCard insights={data.insights} />
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ─── KPI Card ─── */
function KPICard({ icon, iconBg, label, value, change, suffix = "%" }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; change: number; suffix?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</div>
      <div className="mt-2 flex items-center gap-1.5">
        <ChangeBadge change={change} suffix={suffix} />
        <span className="text-[11px] text-slate-400">vs previous period</span>
      </div>
    </div>
  );
}

/* ─── Engagement Funnel ─── */
function EngagementFunnel({ funnel, totalVisits }: { funnel: AnalyticsAPIData["funnel"]; totalVisits: number }) {
  return (
    <div className="lg:col-span-8 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Action Engagement Funnel</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            How guests interact with each feature — conversion from page view to action.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Real-time
        </div>
      </div>

      <div className="space-y-4">
        {funnel.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">
            No feature interactions recorded in this period.
          </div>
        )}
        {funnel.map((item) => {
          const Icon = iconMap[item.icon] || BarChart3;
          const colors = colorMap[item.color] || colorMap.teal;
          const barWidth = totalVisits > 0 ? Math.max(2, Math.min(100, (item.count / totalVisits) * 100)) : 2;

          return (
            <div key={item.eventType} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className={`w-7 h-7 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span>{item.label}</span>
                </span>
                <div className="flex items-center gap-3">
                  <ChangeBadge change={item.change} />
                  <span className="font-mono font-bold text-slate-900 text-xs min-w-[28px] text-right">{item.count}</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {item.pct}% of visitors used this feature
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Touchpoint Distribution ─── */
function TouchpointDistribution({ touchpoints }: { touchpoints: AnalyticsAPIData["touchpoints"] }) {
  const items = [
    { key: "qr", label: "Table QR Code", desc: "Physical tabletop stands", icon: QrCode, data: touchpoints.qr, colors: "bg-teal-50 border-teal-200/60 text-teal-700" },
    { key: "nfc", label: "NFC Touchpoint", desc: "Tap-to-connect tags", icon: Radio, data: touchpoints.nfc, colors: "bg-indigo-50 border-indigo-200/60 text-indigo-700" },
    { key: "direct", label: "Direct / Online", desc: "Browser & shared links", icon: ExternalLink, data: touchpoints.direct, colors: "bg-slate-100 border-slate-200 text-slate-600" },
  ];

  return (
    <div className="lg:col-span-4 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">Touchpoint Distribution</h2>
        <p className="text-xs text-slate-500 mt-0.5">Physical QR vs NFC vs Web Direct</p>

        <div className="space-y-3 mt-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${item.colors}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm block">{item.data.count}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">{item.data.pct}%</span>
                    <ChangeBadge change={item.data.change} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut */}
      <div className="flex items-center justify-center my-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#0D9488" strokeWidth="4"
              strokeDasharray={`${(touchpoints.qr.pct / 100) * 88} ${88 - (touchpoints.qr.pct / 100) * 88}`}
              strokeDashoffset="0" strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#6366F1" strokeWidth="4"
              strokeDasharray={`${(touchpoints.nfc.pct / 100) * 88} ${88 - (touchpoints.nfc.pct / 100) * 88}`}
              strokeDashoffset={`${-(touchpoints.qr.pct / 100) * 88}`} strokeLinecap="round" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#94A3B8" strokeWidth="4"
              strokeDasharray={`${(touchpoints.direct.pct / 100) * 88} ${88 - (touchpoints.direct.pct / 100) * 88}`}
              strokeDashoffset={`${-((touchpoints.qr.pct + touchpoints.nfc.pct) / 100) * 88}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-slate-900">{touchpoints.qr.count + touchpoints.nfc.count + touchpoints.direct.count}</span>
            <span className="text-[9px] text-slate-400">Total</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
        Data is strictly anonymous. No guest personal identity is logged during table scans.
      </div>
    </div>
  );
}

/* ─── Visit Trends Chart ─── */
function VisitTrendsChart({ timeSeries }: { timeSeries: AnalyticsAPIData["timeSeries"] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const visits = timeSeries.map((d) => d.visits);
  const interactions = timeSeries.map((d) => d.interactions);
  const maxVal = Math.max(...visits, ...interactions, 1);

  const dateLabels: { label: string; idx: number }[] = [];
  const step = Math.max(1, Math.floor(timeSeries.length / 5));
  for (let i = 0; i < timeSeries.length; i += step) {
    dateLabels.push({
      label: new Date(timeSeries[i].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      idx: i,
    });
  }

  return (
    <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <h2 className="text-base font-extrabold text-slate-900">Visit & Interaction Trends</h2>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">Daily visits vs feature interactions over time.</p>

      <div className="flex items-center gap-4 text-[11px] mb-3 font-semibold">
        <span className="flex items-center gap-1 text-indigo-700">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Visits
        </span>
        <span className="flex items-center gap-1 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Interactions
        </span>
      </div>

      <div className="relative" onMouseLeave={() => setHoveredIdx(null)}>
        {hoveredIdx !== null && timeSeries[hoveredIdx] && (
          <div className="absolute top-0 bg-white rounded-lg p-2 shadow-lg border border-slate-100 text-center text-xs z-10 pointer-events-none"
            style={{ left: `${(hoveredIdx / Math.max(timeSeries.length - 1, 1)) * 85 + 5}%`, transform: "translateX(-50%)" }}>
            <div className="text-[10px] text-slate-400 font-bold">
              {new Date(timeSeries[hoveredIdx].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="font-extrabold text-indigo-700">{timeSeries[hoveredIdx].visits} visits</div>
            <div className="font-extrabold text-emerald-700">{timeSeries[hoveredIdx].interactions} interactions</div>
          </div>
        )}

        <div className="h-36 flex items-end gap-[2px] pt-8">
          {visits.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            visits.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-stretch gap-[1px] cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}>
                <div className={`rounded-t-xs transition ${hoveredIdx === i ? "bg-indigo-600" : "bg-indigo-300 hover:bg-indigo-400"}`}
                  style={{ height: `${Math.max((v / maxVal) * 100, 2)}%` }} />
                <div className={`rounded-b-xs transition ${hoveredIdx === i ? "bg-emerald-600" : "bg-emerald-300 hover:bg-emerald-400"}`}
                  style={{ height: `${Math.max((interactions[i] / maxVal) * 100, 1)}%` }} />
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
          {dateLabels.map((dl) => (<span key={dl.idx}>{dl.label}</span>))}
        </div>
      </div>
    </div>
  );
}

/* ─── Hourly Heatmap ─── */
function HourlyHeatmap({ hours, peakHour }: { hours: number[]; peakHour: number }) {
  const maxH = Math.max(...hours, 1);
  const timeSlots = [
    { label: "Morning", range: [6, 12], icon: "🌅" },
    { label: "Afternoon", range: [12, 17], icon: "☀️" },
    { label: "Evening", range: [17, 22], icon: "🌆" },
    { label: "Night", range: [22, 6], icon: "🌙" },
  ];

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Peak Hours</h2>
          <p className="text-xs text-slate-500 mt-0.5">When guests engage most.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <Clock className="w-3.5 h-3.5" />
          <span>Peak: {peakHour}:00</span>
        </div>
      </div>

      {/* Hour bars */}
      <div className="h-24 flex items-end gap-[2px] mb-2">
        {hours.map((count, h) => (
          <div key={h} className="flex-1 relative group">
            <div
              className={`w-full rounded-t-xs transition-all duration-300 ${
                h === peakHour ? "bg-emerald-500" : "bg-slate-200 group-hover:bg-slate-400"
              }`}
              style={{ height: `${Math.max((count / maxH) * 100, 3)}%` }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
              {h}:00 — {count}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>

      {/* Time slot summaries */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {timeSlots.map((slot) => {
          const start = slot.range[0];
          const end = slot.range[1];
          const slotTotal = start < end
            ? hours.slice(start, end).reduce((a, b) => a + b, 0)
            : hours.slice(start).reduce((a, b) => a + b, 0) + hours.slice(0, end).reduce((a, b) => a + b, 0);
          return (
            <div key={slot.label} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
              <span className="text-sm">{slot.icon}</span>
              <div className="text-[10px] font-bold text-slate-600 mt-0.5">{slot.label}</div>
              <div className="text-xs font-black text-slate-900">{slotTotal}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Insights Card ─── */
function InsightsCard({ insights }: { insights: AnalyticsAPIData["insights"] }) {
  return (
    <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#0B3B36] to-[#0E473F] text-white shadow-lg lg:col-span-1 flex flex-col justify-between">
      <div>
        <h2 className="text-base font-extrabold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Quick Insights
        </h2>
        <p className="text-xs text-emerald-200/70 mt-0.5 mb-5">Auto-generated from your data.</p>

        <div className="space-y-4">
          {insights.topFeature && (
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">🏆 Most Used Feature</div>
              <div className="text-sm font-bold">{insights.topFeature.label}</div>
              <div className="text-xs text-emerald-200/80 mt-0.5">{insights.topFeature.count} interactions</div>
            </div>
          )}

          {insights.leastUsed && insights.leastUsed.count > 0 && (
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">📉 Needs Attention</div>
              <div className="text-sm font-bold">{insights.leastUsed.label}</div>
              <div className="text-xs text-emerald-200/80 mt-0.5">Only {insights.leastUsed.count} interactions</div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider mb-1">⏰ Peak Hour</div>
            <div className="text-sm font-bold">{insights.peakHourLabel}</div>
            <div className="text-xs text-emerald-200/80 mt-0.5">Most guest activity during this hour</div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 text-[11px] text-emerald-200/50">
        Insights refresh with each period change.
      </div>
    </div>
  );
}
