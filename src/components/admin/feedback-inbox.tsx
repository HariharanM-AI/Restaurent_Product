"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star,
  MessageSquare,
  Smile,
  Download,
  Search,
  ChevronDown,
  ArrowRight,
  MoreHorizontal,
  Lightbulb,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";

/* ─── Types ─── */
interface FeedbackRecord {
  id: string;
  rating: number;
  category?: string | null;
  message: string;
  contact?: string | null;
  isAnonymous: boolean;
  createdAt: Date | string;
}

interface FeedbackStatsData {
  period: string;
  kpis: {
    total: { current: number; change: number };
    avgRating: { current: number; change: number };
    positivePct: { current: number; change: number };
  };
  sentiment: {
    positive: { count: number; pct: number };
    neutral: { count: number; pct: number };
    negative: { count: number; pct: number };
    total: number;
  };
  distribution: { stars: number; count: number; pct: number }[];
  timeSeries: { date: string; count: number; avgRating: number }[];
  topics: { name: string; count: number; pct: number }[];
  categories: string[];
  feedbacks: FeedbackRecord[];
}

interface FeedbackInboxProps {
  restaurantId: string;
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

/* ─── Main Component ─── */
export function FeedbackInbox({ restaurantId }: FeedbackInboxProps) {
  // Date filter
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Data
  const [data, setData] = useState<FeedbackStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback list filters
  const [activeTab, setActiveTab] = useState<"ALL" | "POSITIVE" | "NEUTRAL" | "NEGATIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/restaurants/${restaurantId}/feedback/stats?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Unknown error");
      }
    } catch {
      setError("Unable to load feedback data.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchStats();
  }, [fetchStats, period, customFrom, customTo]);

  // Filtered feedback list
  const filteredFeedbacks = useMemo(() => {
    if (!data) return [];
    return data.feedbacks.filter((f) => {
      if (activeTab === "POSITIVE" && f.rating < 4) return false;
      if (activeTab === "NEUTRAL" && f.rating !== 3) return false;
      if (activeTab === "NEGATIVE" && f.rating > 2) return false;
      if (categoryFilter !== "ALL" && f.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return f.message.toLowerCase().includes(q) || (f.category && f.category.toLowerCase().includes(q));
      }
      return true;
    });
  }, [data, activeTab, categoryFilter, searchQuery]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "30 Days";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 mb-1">← Feedback</div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Guest Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {loading ? "Loading feedback data..." : `Listen to your guests — ${periodLabel}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!data) return;
            const blob = new Blob([JSON.stringify(data.feedbacks, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "guest-feedback-report.json";
            a.click();
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-2 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Report</span>
        </button>
      </div>

      {/* 2. Date Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              setPeriod(p.key);
              setShowCustomPicker(p.key === "custom");
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

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={fetchStats} className="ml-auto text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {data && (
        <>
          {/* 3. KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<MessageSquare className="w-5 h-5" />}
              iconBg="bg-emerald-50 text-emerald-700"
              label="Total Feedback"
              value={fmt(data.kpis.total.current)}
              change={data.kpis.total.change}
              changeLabel="vs previous period"
            />
            <KPICard
              icon={<Star className="w-5 h-5 fill-amber-400 text-amber-500" />}
              iconBg="bg-amber-50 text-amber-600"
              label="Average Rating"
              value={data.kpis.avgRating.current > 0 ? `${data.kpis.avgRating.current} / 5` : "—"}
              change={data.kpis.avgRating.change}
              changeLabel="vs previous period"
              isRatingChange
            />
            <KPICard
              icon={<Smile className="w-5 h-5" />}
              iconBg="bg-emerald-50 text-emerald-700"
              label="Positive Feedback"
              value={`${data.kpis.positivePct.current}%`}
              change={data.kpis.positivePct.change}
              changeLabel="vs previous period"
            />
            <TopMentionsCard topics={data.topics} />
          </div>

          {/* 4. Charts Row: Distribution, Trends, Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RatingDistribution distribution={data.distribution} />
            <FeedbackTrends timeSeries={data.timeSeries} />
            <SentimentDonut sentiment={data.sentiment} />
          </div>

          {/* 5. Feedback List + Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feedback List */}
            <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
              {/* Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1 border-b border-slate-200">
                  {(["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs font-bold transition border-b-2 -mb-px ${
                        activeTab === tab
                          ? "border-emerald-700 text-emerald-900"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab === "ALL" ? "All Feedback" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search feedback..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-44"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    {data.categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Feedback Items */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredFeedbacks.length > 0 ? (
                  filteredFeedbacks.map((item) => (
                    <div key={item.id} className="py-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= item.rating
                                  ? item.rating >= 4
                                    ? "text-emerald-600 fill-emerald-500"
                                    : item.rating === 3
                                    ? "text-amber-500 fill-amber-400"
                                    : "text-red-500 fill-red-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">
                          {item.message}
                        </p>
                        {!item.isAnonymous && item.contact && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            — {item.contact}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.category && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {item.category}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No feedback matching your filters.
                  </div>
                )}
              </div>

              {filteredFeedbacks.length > 0 && (
                <div className="pt-3 mt-2 border-t border-slate-100 text-xs text-slate-400">
                  Showing {filteredFeedbacks.length} of {data.feedbacks.length} feedbacks
                </div>
              )}
            </div>

            {/* Topics + CTA */}
            <div className="space-y-6">
              <TopicsCard topics={data.topics} />

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">Turn feedback into growth</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Use guest feedback to improve your menu, service, and overall experience.
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center shrink-0 transition shadow-2xs">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
function KPICard({
  icon,
  iconBg,
  label,
  value,
  change,
  changeLabel,
  isRatingChange,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  isRatingChange?: boolean;
}) {
  const isPositive = change >= 0;
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</div>
      {change !== 0 ? (
        <div className={`text-xs font-bold mt-2 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isRatingChange ? (
            <span>{isPositive ? "↑" : "↓"} {Math.abs(change)}</span>
          ) : (
            <span>{isPositive ? "↑" : "↓"} {Math.abs(change)}%</span>
          )}
          {" "}
          <span className="text-slate-400 font-normal text-[11px]">{changeLabel}</span>
        </div>
      ) : (
        <div className="text-xs font-bold text-slate-400 mt-2">No previous data</div>
      )}
    </div>
  );
}

/* ─── Top Mentions Card ─── */
function TopMentionsCard({ topics }: { topics: FeedbackStatsData["topics"] }) {
  const top3 = topics.slice(0, 3);
  const colors = [
    "bg-emerald-50 text-emerald-700",
    "bg-blue-50 text-blue-700",
    "bg-purple-50 text-purple-700",
  ];
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className="text-xs font-bold text-slate-500">Response Insights</div>
      <div className="text-lg font-black text-slate-900 tracking-tight mt-1">
        {top3.length > 0 ? "Top Mentions" : "No topics yet"}
      </div>
      <div className="text-xs text-slate-600 mt-1 font-medium">
        {top3.map((t) => t.name).join(", ")}
      </div>
      <div className="flex gap-1.5 mt-3 flex-wrap">
        {top3.map((t, i) => (
          <span key={t.name} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colors[i] || colors[0]}`}>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Rating Distribution ─── */
function RatingDistribution({ distribution }: { distribution: FeedbackStatsData["distribution"] }) {
  const colorMap: Record<number, string> = {
    5: "bg-[#0F766E]",
    4: "bg-emerald-500",
    3: "bg-amber-400",
    2: "bg-orange-500",
    1: "bg-red-500",
  };

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-slate-900">Rating Distribution</h2>
        <p className="text-xs text-slate-500 mt-0.5">Breakdown of feedback ratings in this period.</p>
      </div>

      <div className="space-y-3.5 my-2">
        {distribution.map((row) => (
          <div key={row.stars} className="flex items-center gap-3 text-xs">
            <span className="w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
              <Star
                className={`w-3.5 h-3.5 ${
                  row.stars >= 4
                    ? "text-emerald-600 fill-emerald-500"
                    : row.stars === 3
                    ? "text-amber-500 fill-amber-400"
                    : "text-red-500 fill-red-400"
                }`}
              />
              <span>{row.stars} stars</span>
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${colorMap[row.stars]} transition-all duration-500`}
                style={{ width: `${Math.max(row.pct, 1)}%` }}
              />
            </div>
            <span className="w-16 text-right font-mono text-slate-500 text-[11px] shrink-0">
              {row.pct}% ({row.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Feedback Trends ─── */
function FeedbackTrends({ timeSeries }: { timeSeries: FeedbackStatsData["timeSeries"] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = timeSeries.map((d) => d.count);
  const maxVal = Math.max(...data, 1);

  const dateLabels: { label: string; idx: number }[] = [];
  const step = Math.max(1, Math.floor(timeSeries.length / 6));
  for (let i = 0; i < timeSeries.length; i += step) {
    const d = new Date(timeSeries[i].date);
    dateLabels.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      idx: i,
    });
  }

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Feedback Trends</h2>
          <p className="text-xs text-slate-500 mt-0.5">Daily feedback count and average rating.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] mb-2 font-semibold">
        <span className="flex items-center gap-1 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Feedback count
        </span>
        <span className="flex items-center gap-1 text-teal-700">
          <span className="w-3 border-t-2 border-[#0F766E]" />
          Average rating
        </span>
      </div>

      <div className="relative">
        {/* Tooltip */}
        {hoveredIdx !== null && timeSeries[hoveredIdx] && (
          <div
            className="absolute top-0 bg-white rounded-lg p-2 shadow-lg border border-slate-100 text-center text-xs z-10 pointer-events-none"
            style={{
              left: `${(hoveredIdx / Math.max(timeSeries.length - 1, 1)) * 85 + 5}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-[10px] text-slate-400 font-bold">
              {new Date(timeSeries[hoveredIdx].date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="font-extrabold text-slate-900">{timeSeries[hoveredIdx].count} feedback</div>
            {timeSeries[hoveredIdx].avgRating > 0 && (
              <div className="text-[10px] text-emerald-600 font-bold">
                ★ {timeSeries[hoveredIdx].avgRating} average
              </div>
            )}
          </div>
        )}

        <div
          className="h-36 flex items-end gap-[2px] pt-8"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              No feedback in this period
            </div>
          ) : (
            data.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-xs transition cursor-pointer ${
                  hoveredIdx === i ? "bg-emerald-600" : "bg-emerald-300 hover:bg-emerald-400"
                }`}
                style={{ height: `${Math.max((h / maxVal) * 100, 2)}%` }}
                onMouseEnter={() => setHoveredIdx(i)}
              />
            ))
          )}
        </div>

        {/* X Labels */}
        <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
          {dateLabels.map((dl) => (
            <span key={dl.idx}>{dl.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sentiment Donut ─── */
function SentimentDonut({ sentiment }: { sentiment: FeedbackStatsData["sentiment"] }) {
  const circ = 88; // circumference for r=14
  const posDash = (sentiment.positive.pct / 100) * circ;
  const neuDash = (sentiment.neutral.pct / 100) * circ;
  const negDash = (sentiment.negative.pct / 100) * circ;

  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">Feedback Sentiment</h2>
        <p className="text-xs text-slate-500 mt-0.5">Overall sentiment from guest feedback.</p>
      </div>

      <div className="flex items-center justify-center my-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke="#0F766E"
              strokeWidth="4.5"
              strokeDasharray={`${posDash} ${circ - posDash}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke="#94A3B8"
              strokeWidth="4.5"
              strokeDasharray={`${neuDash} ${circ - neuDash}`}
              strokeDashoffset={`${-posDash}`}
              strokeLinecap="round"
            />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke="#EF4444"
              strokeWidth="4.5"
              strokeDasharray={`${negDash} ${circ - negDash}`}
              strokeDashoffset={`${-(posDash + neuDash)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-slate-900 leading-tight">{sentiment.total}</span>
            <span className="text-[10px] text-slate-400">Total Feedback</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]" />
            <span className="font-semibold text-slate-700">Positive</span>
          </div>
          <span className="font-mono text-slate-900 font-bold">{sentiment.positive.pct}% ({sentiment.positive.count})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
            <span className="font-semibold text-slate-700">Neutral</span>
          </div>
          <span className="font-mono text-slate-900 font-bold">{sentiment.neutral.pct}% ({sentiment.neutral.count})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="font-semibold text-slate-700">Negative</span>
          </div>
          <span className="font-mono text-slate-900 font-bold">{sentiment.negative.pct}% ({sentiment.negative.count})</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Topics Card ─── */
function TopicsCard({ topics }: { topics: FeedbackStatsData["topics"] }) {
  return (
    <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Common Feedback Topics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Most mentioned keywords in feedback.</p>
        </div>
      </div>

      <div className="space-y-3">
        {topics.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-4">No topics identified yet</div>
        )}
        {topics.map((topic) => (
          <div key={topic.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{topic.name}</span>
              <span className="font-mono text-slate-900">{topic.count}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all duration-500"
                style={{ width: `${topic.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
