"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { subscribeToActivity } from "@/lib/realtime/broadcast";
import {
  Star,
  MessageSquare,
  Smile,
  Download,
  Search,
  ChevronDown,
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
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mb-3" />
      <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
      <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
  );
}

/* ─── Star Rating Renderer ─── */
function StarRating({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? rating >= 4
                ? "text-emerald-600 fill-emerald-500"
                : rating === 3
                ? "text-amber-500 fill-amber-400"
                : "text-red-500 fill-red-400"
              : "text-slate-200 dark:text-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export function FeedbackInbox({ restaurantId }: FeedbackInboxProps) {
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [data, setData] = useState<FeedbackStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ALL" | "POSITIVE" | "NEUTRAL" | "NEGATIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
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
        if (!isSilent) setError(json.error || "Unknown error");
      }
    } catch {
      if (!isSilent) setError("Unable to load feedback data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [restaurantId, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchStats();
  }, [fetchStats, period, customFrom, customTo]);

  // Real-time synchronization on guest activity
  useEffect(() => {
    const unsubscribe = subscribeToActivity(restaurantId, () => {
      fetchStats(true);
    });

    const pollInterval = setInterval(() => {
      fetchStats(true);
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [restaurantId, fetchStats]);

  const filteredFeedbacks = useMemo(() => {
    if (!data) return [];
    return data.feedbacks.filter((f) => {
      if (activeTab === "POSITIVE" && f.rating < 4) return false;
      if (activeTab === "NEUTRAL" && f.rating !== 3) return false;
      if (activeTab === "NEGATIVE" && f.rating > 2) return false;
      if (categoryFilter !== "ALL" && f.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (ratingFilter !== "ALL" && f.rating !== parseInt(ratingFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return f.message.toLowerCase().includes(q) || (f.category && f.category.toLowerCase().includes(q));
      }
      return true;
    });
  }, [data, activeTab, categoryFilter, ratingFilter, searchQuery]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "30 Days";

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Feedback</div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Guest Feedback
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-2 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400"
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
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
        )}
        {loading && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-2" />}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => fetchStats()} className="ml-auto text-xs font-bold underline">Retry</button>
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
              iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
              label="Total Feedback"
              value={fmt(data.kpis.total.current)}
              change={data.kpis.total.change}
              changeLabel="vs previous period"
            />
            <KPICard
              icon={<Star className="w-5 h-5 fill-amber-400 text-amber-500" />}
              iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
              label="Average Rating"
              value={data.kpis.avgRating.current > 0 ? `${data.kpis.avgRating.current} / 5` : "—"}
              change={data.kpis.avgRating.change}
              changeLabel="vs previous period"
              isRatingChange
            />
            <KPICard
              icon={<Smile className="w-5 h-5" />}
              iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
              label="Positive Feedback"
              value={`${data.kpis.positivePct.current}%`}
              change={data.kpis.positivePct.change}
              changeLabel="vs previous period"
            />
            <TopMentionsCard topics={data.topics} />
          </div>

          {/* 4. Charts: Rating Distribution + Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RatingDistribution distribution={data.distribution} />
            <FeedbackTrends timeSeries={data.timeSeries} />
            <TopicsCard topics={data.topics} />
          </div>

          {/* 5. Feedback Table (matching uploaded image design) */}
          <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
                {(["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-bold transition border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-emerald-700 dark:border-emerald-500 text-emerald-900 dark:text-emerald-400"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-44"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Categories</option>
                  {data.categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feedback Table with Column Headers */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-3 px-3 w-24">Rating</th>
                    <th className="text-left py-3 px-3">Feedback</th>
                    <th className="text-center py-3 px-3 w-28">Category</th>
                    <th className="text-right py-3 px-3 w-36">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredFeedbacks.length > 0 ? (
                    filteredFeedbacks.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-3 align-top">
                          <StarRating rating={item.rating} size="w-4 h-4" />
                        </td>
                        <td className="py-4 px-3 align-top">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                              {item.message.length > 80
                                ? item.message.slice(0, 80).split(" ").slice(0, -1).join(" ") + "..."
                                : item.message.split(".")[0] || item.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {item.message}
                            </p>
                            {!item.isAnonymous && item.contact && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
                                — {item.contact}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center align-top">
                          {item.category ? (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              item.category.toLowerCase() === "food" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
                              item.category.toLowerCase() === "service" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" :
                              item.category.toLowerCase() === "ambience" ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" :
                              "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                            }`}>
                              {item.category}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-right align-top whitespace-nowrap">
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(item.createdAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                        No feedback matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredFeedbacks.length > 0 && (
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                Showing {filteredFeedbacks.length} of {data.feedbacks.length} feedbacks
              </div>
            )}
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
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{value}</div>
      {change !== 0 ? (
        <div className={`text-xs font-bold mt-2 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
          {isRatingChange ? (
            <span>{isPositive ? "↑" : "↓"} {Math.abs(change)}</span>
          ) : (
            <span>{isPositive ? "↑" : "↓"} {Math.abs(change)}%</span>
          )}
          {" "}
          <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">{changeLabel}</span>
        </div>
      ) : (
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">No previous data</div>
      )}
    </div>
  );
}

/* ─── Top Mentions Card ─── */
function TopMentionsCard({ topics }: { topics: FeedbackStatsData["topics"] }) {
  const top3 = topics.slice(0, 3);
  const colors = [
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
    "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
    "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400",
  ];
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
        <MessageSquare className="w-5 h-5" />
      </div>
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Response Insights</div>
      <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">
        {top3.length > 0 ? "Top Mentions" : "No topics yet"}
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
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

/* ─── Rating Distribution (larger stars matching uploaded image) ─── */
function RatingDistribution({ distribution }: { distribution: FeedbackStatsData["distribution"] }) {
  const starColors: Record<number, string> = {
    5: "#10B981", // emerald
    4: "#34D399", // emerald lighter
    3: "#F59E0B", // amber
    2: "#F97316", // orange
    1: "#EF4444", // red
  };

  const barColors: Record<number, string> = {
    5: "bg-emerald-500",
    4: "bg-emerald-400",
    3: "bg-amber-400",
    2: "bg-orange-400",
    1: "bg-red-400",
  };

  return (
    <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Rating Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Breakdown of all feedback ratings.</p>
        </div>
      </div>

      <div className="space-y-4 my-2">
        {distribution.map((row) => (
          <div key={row.stars} className="flex items-center gap-3">
            {/* Large colored star + label */}
            <div className="flex items-center gap-1.5 w-20 shrink-0">
              <Star
                className="w-5 h-5"
                style={{ color: starColors[row.stars], fill: starColors[row.stars] }}
              />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {row.stars} star{row.stars !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Bar */}
            <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColors[row.stars]} transition-all duration-500`}
                style={{ width: `${Math.max(row.pct, 2)}%` }}
              />
            </div>
            {/* Percentage + Count */}
            <span className="w-24 text-right text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">
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
    <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Feedback Trends</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily feedback count and average rating.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] mb-2 font-semibold">
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Feedback count
        </span>
        <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400">
          <span className="w-3 border-t-2 border-[#0F766E]" />
          Average rating
        </span>
      </div>

      <div className="relative">
        {hoveredIdx !== null && timeSeries[hoveredIdx] && (
          <div
            className="absolute top-0 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-100 dark:border-slate-700 text-center text-xs z-10 pointer-events-none"
            style={{
              left: `${(hoveredIdx / Math.max(timeSeries.length - 1, 1)) * 85 + 5}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
              {new Date(timeSeries[hoveredIdx].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="font-extrabold text-slate-900 dark:text-white">{timeSeries[hoveredIdx].count} feedback</div>
            {timeSeries[hoveredIdx].avgRating > 0 && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{timeSeries[hoveredIdx].avgRating} average</span>
              </div>
            )}
          </div>
        )}

        <div
          className="h-36 flex items-end gap-[2px] pt-8"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
              No feedback in this period
            </div>
          ) : (
            data.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-xs transition cursor-pointer ${
                  hoveredIdx === i ? "bg-emerald-600" : "bg-emerald-300 dark:bg-emerald-700 hover:bg-emerald-400"
                }`}
                style={{ height: `${Math.max((h / maxVal) * 100, 2)}%` }}
                onMouseEnter={() => setHoveredIdx(i)}
              />
            ))
          )}
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
          {dateLabels.map((dl) => (
            <span key={dl.idx}>{dl.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Common Feedback Topics (matching uploaded image - horizontal bars) ─── */
function TopicsCard({ topics }: { topics: FeedbackStatsData["topics"] }) {
  const maxCount = Math.max(...topics.map(t => t.count), 1);

  return (
    <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Common Feedback Topics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Most mentioned keywords in feedback.</p>
        </div>
      </div>

      <div className="space-y-3">
        {topics.length === 0 && (
          <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">No topics identified yet</div>
        )}
        {topics.map((topic, idx) => (
          <div key={topic.name} className="flex items-center gap-3">
            <span className="w-24 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 truncate">{topic.name}</span>
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  idx % 2 === 0 ? "bg-[#0F766E]" : "bg-emerald-400"
                }`}
                style={{ width: `${Math.max((topic.count / maxCount) * 100, 3)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 w-10 text-right shrink-0">{topic.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
