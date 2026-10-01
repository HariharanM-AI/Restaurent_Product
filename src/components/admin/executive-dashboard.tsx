"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { subscribeToActivity } from "@/lib/realtime/broadcast";
import {
  Users,
  Award,
  Star,
  MessageSquare,
  Gift,
  QrCode,
  Wifi,
  TrendingUp,
  ArrowRight,
  UtensilsCrossed,
  Share2,
  Tag,
  ChevronDown,
  Calendar,
  Loader2,
  AlertCircle,
  Sparkles,
  Activity,
  Clock,
  ChevronRight,
} from "lucide-react";

/* ─── Types ─── */
interface DashboardGuest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  totalVisits: number;
  activeRewards: number;
  lastVisit: string;
  joinedAt: string;
}

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  kpis: {
    visits: { current: number; previous: number; change: number };
    stamps: { current: number; previous: number; change: number };
    feedbacks: { current: number; previous: number; change: number };
    newCustomers: { current: number; previous: number; change: number };
    returningPct: number;
  };
  timeSeries: { date: string; current: number; previous: number }[];
  actionBreakdown: { action: string; icon: string; count: number; percentage: number }[];
  loyalty: {
    activeWallets: number;
    stampsIssued: number;
    milestonesUnlocked: number;
    rewardsRedeemed: number;
  };
  customerInsights: {
    totalGuests: number;
    newGuestsPct: number;
    returningPct: number;
    identifiedGuests: number;
    anonymousGuests: number;
  };
  feedbackDistribution: { stars: number; count: number; percentage: number }[];
  averageRating: number;
  positivePct: number;
  heatmap: number[][];
  funnel: { label: string; count: number; percentage: number }[];
  guests: DashboardGuest[];
}

interface ExecutiveDashboardProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
  };
}

/* ─── Helpers ─── */
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "1y", label: "1 Year" },
  { key: "custom", label: "Custom" },
] as const;

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString();
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  QrCode, UtensilsCrossed, Star, Wifi, Award, MessageSquare, Share2, Gift, Sparkles, Activity, Clock, AlertCircle, Tag, TrendingUp,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || Activity;
  return <Icon className={className} />;
}

/* ─── Skeleton Loader ─── */
function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-7 w-16 bg-slate-100 rounded" />
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "h-72" }: { className?: string }) {
  return (
    <div className={`rounded-[24px] bg-white border border-slate-200/80 shadow-xs animate-pulse ${className}`} />
  );
}

/* ─── SVG Chart Helpers ─── */
function buildPolylinePath(data: number[], width: number, height: number, padding = 8): string {
  if (data.length === 0) return "";
  const max = Math.max(...data, 1);
  const step = (width - padding * 2) / Math.max(data.length - 1, 1);
  return data
    .map((val, i) => {
      const x = padding + i * step;
      const y = padding + (1 - val / max) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(data: number[], width: number, height: number, padding = 8): string {
  if (data.length === 0) return "";
  const linePath = buildPolylinePath(data, width, height, padding);
  const lastX = padding + (data.length - 1) * ((width - padding * 2) / Math.max(data.length - 1, 1));
  return `${linePath} L ${lastX.toFixed(1)},${height - padding} L ${padding},${height - padding} Z`;
}

/* ─── Main Component ─── */
export function ExecutiveDashboard({ restaurant }: ExecutiveDashboardProps) {
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);
    try {
      let url = `/api/restaurants/${restaurant.id}/dashboard?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        if (!isSilent) setError(json.error || "Unknown error");
      }
    } catch {
      if (!isSilent) setError("Unable to load dashboard data. Please try again.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [restaurant.id, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchDashboard();
  }, [fetchDashboard, period, customFrom, customTo]);

  // Real-time synchronization whenever guest opens or uses the guest hub
  useEffect(() => {
    const unsubscribe = subscribeToActivity(restaurant.id, () => {
      fetchDashboard(true);
    });

    const pollInterval = setInterval(() => {
      fetchDashboard(true);
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [restaurant.id, fetchDashboard]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "30 Days";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header + Date Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Overview
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {greeting}, {restaurant.name}
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 mt-1">
              {loading
                ? "Loading your dashboard..."
                : `Here's how your guest experience performed — ${periodLabel}`}
            </p>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPeriod(p.key);
                if (p.key === "custom") {
                  setShowCustomPicker(true);
                } else {
                  setShowCustomPicker(false);
                }
              }}
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

          {showCustomPicker && period === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
          )}

          {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-2" />}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => fetchDashboard()} className="ml-auto text-xs font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonBlock className="lg:col-span-2 h-80" />
            <SkeletonBlock className="h-80" />
          </div>
          <SkeletonBlock className="h-72" />
        </>
      )}

      {/* Real Data Dashboard */}
      {data && (
        <>
          {/* 2. KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-emerald-50 text-emerald-700"
              label="Guest Engagements"
              value={fmt(data.kpis.visits.current)}
              change={data.kpis.visits.change}
              sparkData={data.timeSeries.map((d) => d.current)}
              color="#10B981"
              gradientId="gradEmerald"
            />
            <KPICard
              icon={<Award className="w-5 h-5" />}
              iconBg="bg-blue-50 text-blue-700"
              label="Loyalty Stamps"
              value={fmt(data.kpis.stamps.current)}
              change={data.kpis.stamps.change}
              sparkData={data.timeSeries.map((d) => d.current)}
              color="#3B82F6"
              gradientId="gradBlue"
            />
            <KPICard
              icon={<MessageSquare className="w-5 h-5" />}
              iconBg="bg-purple-50 text-purple-700"
              label="Guest Feedback"
              value={fmt(data.kpis.feedbacks.current)}
              change={data.kpis.feedbacks.change}
              sparkData={data.timeSeries.map((d) => d.current)}
              color="#8B5CF6"
              gradientId="gradPurple"
            />
            <KPICard
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-amber-50 text-amber-700"
              label="Returning Guests"
              value={`${data.kpis.returningPct}%`}
              change={0}
              sparkData={data.timeSeries.map((d) => d.current)}
              color="#F59E0B"
              gradientId="gradAmber"
            />
          </div>

          {/* 3. Engagement Chart + Guest Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <EngagementChart timeSeries={data.timeSeries} />
            <GuestActionsBreakdown actions={data.actionBreakdown} />
          </div>

          {/* 4. Loyalty, Customer Insights, Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LoyaltyPerformance
              loyalty={data.loyalty}
              restaurantId={restaurant.id}
              timeSeries={data.timeSeries}
            />
            <CustomerInsights
              insights={data.customerInsights}
              restaurantId={restaurant.id}
            />
            <FeedbackOverview
              distribution={data.feedbackDistribution}
              averageRating={data.averageRating}
              positivePct={data.positivePct}
              restaurantId={restaurant.id}
            />
          </div>

          {/* 5. Heatmap + Funnel (no more Recent Activity) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PeakActivityHeatmap heatmap={data.heatmap} />
            <ReviewFunnel funnel={data.funnel} />
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─── KPI Card ─── */
function KPICard({
  icon,
  iconBg,
  label,
  value,
  change,
  sparkData,
  color,
  gradientId,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change: number;
  sparkData: number[];
  color: string;
  gradientId: string;
}) {
  const isPositive = change >= 0;
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-bold text-slate-500">{label}</div>
        <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</div>
        {change !== 0 && (
          <div className={`flex items-center gap-1.5 mt-2 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            <span>{isPositive ? "↑" : "↓"} {Math.abs(change)}%</span>
            <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
          </div>
        )}
        {change === 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-slate-400">
            <span>No previous data</span>
          </div>
        )}
      </div>
      {/* Mini Sparkline */}
      <div className="h-10 mt-3 -mx-2 -mb-2">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {sparkData.length > 1 && (
            <>
              <path d={buildAreaPath(sparkData, 100, 30, 2)} fill={`url(#${gradientId})`} />
              <path d={buildPolylinePath(sparkData, 100, 30, 2)} fill="none" stroke={color} strokeWidth="2" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ─── Engagement Chart ─── */
function EngagementChart({
  timeSeries,
}: {
  timeSeries: { date: string; current: number; previous: number }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const currentData = timeSeries.map((d) => d.current);
  const previousData = timeSeries.map((d) => d.previous);
  const maxVal = Math.max(...currentData, ...previousData, 1);

  // Clean, consistent Y-axis tick intervals
  const yTicks = [maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0];

  // Normalized coordinate space
  const svgW = 1000;
  const svgH = 200;
  const padTop = 15;
  const padBottom = 15;
  const plotH = svgH - padTop - padBottom;

  const toY = (val: number) => padTop + (1 - val / maxVal) * plotH;
  const toX = (i: number) => {
    if (timeSeries.length <= 1) return svgW / 2;
    return (i / (timeSeries.length - 1)) * svgW;
  };

  const currentPath = currentData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");
  const prevPath = previousData
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");
  const areaPath = currentData.length > 0
    ? `${currentPath} L ${svgW},${svgH - padBottom} L 0,${svgH - padBottom} Z`
    : "";

  // Date labels distributed across the series, strictly including the first and last days
  const dateLabels: { label: string; idx: number }[] = [];
  if (timeSeries.length > 0) {
    const numLabels = Math.min(7, timeSeries.length);
    const step = (timeSeries.length - 1) / (numLabels - 1);
    for (let l = 0; l < numLabels; l++) {
      const idx = Math.round(l * step);
      if (idx < timeSeries.length) {
        const d = new Date(timeSeries[idx].date);
        dateLabels.push({
          label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          idx,
        });
      }
    }
    // Guarantee last index is exactly the last date in the series
    if (dateLabels.length > 0) {
      const lastIdx = timeSeries.length - 1;
      const d = new Date(timeSeries[lastIdx].date);
      dateLabels[dateLabels.length - 1] = {
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        idx: lastIdx,
      };
    }
  }

  return (
    <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Guest Engagement</h2>
          <p className="text-xs text-slate-500 mt-0.5">Guest interactions over the selected period.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
              Current period
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-400">
              <span className="w-3 border-t-2 border-dashed border-slate-300" />
              Previous period
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex gap-3 items-stretch relative select-none">
        {/* Y-Axis Column pinned to the far left */}
        <div className="w-8 shrink-0 flex flex-col justify-between text-right text-[11px] font-semibold text-slate-400 select-none pb-7 pt-1">
          {yTicks.map((val, idx) => (
            <span key={idx} className="leading-none">{fmt(val)}</span>
          ))}
        </div>

        {/* Plot Area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Tooltip */}
          {hoveredIdx !== null && timeSeries[hoveredIdx] && (
            <div
              className="absolute -top-3 z-30 bg-white rounded-xl p-3 shadow-xl border border-slate-100 pointer-events-none text-center animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
              style={{
                left: `${(hoveredIdx / Math.max(timeSeries.length - 1, 1)) * 100}%`,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {new Date(timeSeries[hoveredIdx].date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {timeSeries[hoveredIdx].current.toLocaleString()} engagements
              </div>
              {timeSeries[hoveredIdx].previous > 0 && (
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                  vs {timeSeries[hoveredIdx].previous.toLocaleString()} prev
                </div>
              )}
            </div>
          )}

          {/* SVG Canvas */}
          <div className="relative w-full h-56">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgW} ${svgH}`}
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {yTicks.map((_, i) => {
                const y = padTop + (i / (yTicks.length - 1)) * plotH;
                return (
                  <line
                    key={i}
                    x1="0"
                    y1={y}
                    x2={svgW}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {/* Previous period line */}
              {previousData.length > 1 && (
                <path
                  d={prevPath}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {/* Current period area & curve */}
              {currentData.length > 1 && (
                <>
                  <path d={areaPath} fill="url(#areaGradient)" />
                  <path
                    d={currentPath}
                    fill="none"
                    stroke="#0F766E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}

              {/* Hover point & vertical indicator */}
              {hoveredIdx !== null && (
                <g>
                  <line
                    x1={toX(hoveredIdx)}
                    y1={toY(currentData[hoveredIdx] || 0)}
                    x2={toX(hoveredIdx)}
                    y2={svgH - padBottom}
                    stroke="#0F766E"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={toX(hoveredIdx)}
                    cy={toY(currentData[hoveredIdx] || 0)}
                    r="5"
                    fill="#0F766E"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
            </svg>

            {/* Hover Trigger Overlay Columns */}
            <div
              className="absolute inset-0 flex"
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {currentData.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-full cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                />
              ))}
            </div>
          </div>

          {/* X-Axis Date Labels: Positioned at exact data point percentages */}
          <div className="relative w-full h-6 mt-3">
            {dateLabels.map((dl) => {
              const pct = (dl.idx / Math.max(timeSeries.length - 1, 1)) * 100;
              return (
                <span
                  key={dl.idx}
                  className="absolute text-[11px] font-semibold text-slate-400 whitespace-nowrap"
                  style={{
                    left: `${pct}%`,
                    transform:
                      dl.idx === 0
                        ? "none"
                        : dl.idx === timeSeries.length - 1
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                  }}
                >
                  {dl.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Guest Actions Breakdown ─── */
function GuestActionsBreakdown({ actions }: { actions: DashboardData["actionBreakdown"] }) {
  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Guest Actions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Which features your guests interact with most.</p>
        </div>
      </div>

      <div className="space-y-4">
        {actions.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">No action data yet</div>
        )}
        {actions.map((item) => (
          <div key={item.action}>
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <DynamicIcon name={item.icon} className="w-4 h-4 text-emerald-700" />
                <span>{item.action}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-900">
                <span>{item.count.toLocaleString()}</span>
                <span className="text-slate-400 font-normal">{item.percentage}%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all duration-500"
                style={{ width: `${Math.max(item.percentage, 1)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Loyalty Performance ─── */
function LoyaltyPerformance({
  loyalty,
  restaurantId,
  timeSeries,
}: {
  loyalty: DashboardData["loyalty"];
  restaurantId: string;
  timeSeries: DashboardData["timeSeries"];
}) {
  const barData = timeSeries.slice(-20).map((d) => d.current);
  const maxBar = Math.max(...barData, 1);

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Loyalty Performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track how your loyalty program is performing.</p>
        </div>
        <Link
          href={`/admin/restaurants/${restaurantId}/loyalty`}
          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
        >
          <span>View details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Active Wallets</div>
          <div className="text-base font-black text-slate-900 mt-0.5">{loyalty.activeWallets.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Stamps Issued</div>
          <div className="text-base font-black text-slate-900 mt-0.5">{loyalty.stampsIssued.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Milestones</div>
          <div className="text-base font-black text-slate-900 mt-0.5">{loyalty.milestonesUnlocked.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Redeemed</div>
          <div className="text-base font-black text-slate-900 mt-0.5">{loyalty.rewardsRedeemed.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-bold text-slate-500 mb-2">Activity trend</div>
        <div className="h-20 flex items-end gap-1">
          {barData.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t-xs bg-emerald-600 hover:bg-emerald-700 transition"
              style={{ height: `${Math.max((val / maxBar) * 100, 2)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Customer Insights ─── */
function CustomerInsights({
  insights,
  restaurantId,
}: {
  insights: DashboardData["customerInsights"];
  restaurantId: string;
}) {
  const newPct = insights.newGuestsPct || 0;
  const retPct = insights.returningPct || 0;
  const newDash = (newPct / 100) * 88;
  const retDash = (retPct / 100) * 88;

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Customer Insights</h2>
          <p className="text-xs text-slate-500 mt-0.5">Understand your guest base.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
        {/* Donut */}
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke="#0F766E"
              strokeWidth="4"
              strokeDasharray={`${newDash} ${88 - newDash}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke="#34D399"
              strokeWidth="4"
              strokeDasharray={`${retDash} ${88 - retDash}`}
              strokeDashoffset={`${-newDash}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            <span className="text-sm font-black text-slate-900 leading-tight">{insights.totalGuests.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-medium">Total Guests</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]" />
              <span>New Guests</span>
            </div>
            <div className="font-mono text-slate-900 font-bold">
              {(insights.totalGuests - (insights.totalGuests * retPct / 100)).toFixed(0)}{" "}
              <span className="text-slate-400 font-normal text-[11px]">{newPct}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#34D399]" />
              <span>Returning Guests</span>
            </div>
            <div className="font-mono text-slate-900 font-bold">
              {Math.round(insights.totalGuests * retPct / 100)}{" "}
              <span className="text-slate-400 font-normal text-[11px]">{retPct}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Identified Guests</span>
            <span className="font-mono text-slate-900 font-bold">
              {insights.identifiedGuests.toLocaleString()}{" "}
              <span className="text-slate-400 font-normal text-[11px]">
                {insights.totalGuests > 0 ? Math.round((insights.identifiedGuests / insights.totalGuests) * 100) : 0}%
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Anonymous Guests</span>
            <span className="font-mono text-slate-900 font-bold">
              {insights.anonymousGuests.toLocaleString()}{" "}
              <span className="text-slate-400 font-normal text-[11px]">
                {insights.totalGuests > 0 ? Math.round((insights.anonymousGuests / insights.totalGuests) * 100) : 0}%
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feedback Overview ─── */
function FeedbackOverview({
  distribution,
  averageRating,
  positivePct,
  restaurantId,
}: {
  distribution: DashboardData["feedbackDistribution"];
  averageRating: number;
  positivePct: number;
  restaurantId: string;
}) {
  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Feedback Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">See what your guests are saying.</p>
        </div>
        <Link
          href={`/admin/restaurants/${restaurantId}/feedback`}
          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3 my-2">
        {distribution.map((item) => (
          <div key={item.stars} className="flex items-center gap-3 text-xs">
            <span className="w-14 font-semibold text-slate-600 shrink-0">
              {item.stars} star{item.stars !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-slate-400 shrink-0">{item.percentage}%</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Average: <strong className="text-slate-900 font-black">{averageRating > 0 ? averageRating.toFixed(1) : "—"} / 5.0</strong>
        </span>
        <span className="text-emerald-600 font-bold">{positivePct}% Positive</span>
      </div>
    </div>
  );
}

/* ─── Peak Activity Heatmap ─── */
function PeakActivityHeatmap({ heatmap }: { heatmap: number[][] }) {
  const timeSlots = ["Morning", "Afternoon", "Evening", "Night"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const intensityClasses = [
    "bg-emerald-100",
    "bg-emerald-300",
    "bg-emerald-500",
    "bg-[#07352F]",
  ];

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Peak Guest Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">When your guests are most active.</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          <span>Less</span>
          <div className="flex gap-0.5">
            {intensityClasses.map((c, i) => (
              <span key={i} className={`w-2 h-2 rounded-xs ${c}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pl-16">
          {days.map((d) => (
            <span key={d} className="flex-1 text-center">{d}</span>
          ))}
        </div>

        {heatmap.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-1.5">
            <span className="w-14 text-[10px] font-bold text-slate-400 text-right shrink-0">
              {timeSlots[rowIdx]}
            </span>
            {row.map((val, colIdx) => (
              <div
                key={colIdx}
                className={`flex-1 h-5 rounded-xs ${intensityClasses[val] || intensityClasses[0]} hover:opacity-80 transition cursor-pointer`}
                title={`${days[colIdx]} ${timeSlots[rowIdx]}: Level ${val}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Review Journey Funnel ─── */
function ReviewFunnel({ funnel }: { funnel: DashboardData["funnel"] }) {
  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-slate-900">Review Journey</h2>
        <p className="text-xs text-slate-500 mt-0.5">From guest interaction to feedback.</p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center my-auto">
        {funnel.map((stage) => (
          <div key={stage.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-sm font-black text-slate-900">{stage.count.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stage.label}</div>
            <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              {stage.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
