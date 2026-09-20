"use client";

import React, { useState, useMemo } from "react";
import {
  Star,
  MessageSquare,
  Smile,
  Users,
  Download,
  Search,
  ChevronDown,
  ArrowRight,
  MoreHorizontal,
  Lightbulb,
  Utensils,
  Coffee,
  Music,
  CheckCircle2,
  DollarSign,
  Sparkles,
} from "lucide-react";

interface FeedbackRecord {
  id: string;
  rating: number;
  category?: string | null;
  message: string;
  contact?: string | null;
  isAnonymous: boolean;
  createdAt: Date | string;
}

interface FeedbackInboxProps {
  initialFeedbacks: FeedbackRecord[];
}

export function FeedbackInbox({ initialFeedbacks }: FeedbackInboxProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "POSITIVE" | "NEUTRAL" | "NEGATIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const sampleItems: FeedbackRecord[] = useMemo(() => {
    if (initialFeedbacks && initialFeedbacks.length > 0) {
      return initialFeedbacks;
    }
    return [
      {
        id: "fb-1",
        rating: 5,
        category: "Food",
        message: "The pasta was absolutely delicious and the staff were so friendly. Will definitely be coming back!",
        isAnonymous: false,
        createdAt: new Date("2025-03-31T19:42:00"),
      },
      {
        id: "fb-2",
        rating: 4,
        category: "Ambience",
        message: "Loved the ambience and music. Food was great too. A little noisy during peak hours.",
        isAnonymous: false,
        createdAt: new Date("2025-03-31T18:15:00"),
      },
      {
        id: "fb-3",
        rating: 3,
        category: "Service",
        message: "The food was good, but the service was a bit slow. Otherwise a nice place.",
        isAnonymous: true,
        createdAt: new Date("2025-03-30T17:28:00"),
      },
      {
        id: "fb-4",
        rating: 5,
        category: "Food",
        message: "Everything was perfect. The flavors, the service, the atmosphere. Keep it up!",
        isAnonymous: false,
        createdAt: new Date("2025-03-30T21:14:00"),
      },
      {
        id: "fb-5",
        rating: 2,
        category: "Service",
        message: "Food took very long to arrive and was cold. Hoping for a better experience next time.",
        isAnonymous: true,
        createdAt: new Date("2025-03-30T20:03:00"),
      },
    ];
  }, [initialFeedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return sampleItems.filter((f) => {
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
  }, [sampleItems, activeTab, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Header (Exact Match to Image 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 mb-1">← Feedback</div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Guest Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Listen to your guests. Turn feedback into exceptional experiences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(sampleItems, null, 2)], { type: "application/json" });
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

      {/* 2. Top 4 Metric Cards (Exact Match to Image 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-500">Total Feedback</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">486</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">
              ↑ 21.3% <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Bar Sparkline */}
          <div className="h-6 flex items-end gap-1 mt-3">
            {[30, 45, 60, 40, 75, 50, 90, 80, 65, 85, 95, 70, 80].map((v, i) => (
              <div key={i} className="flex-1 bg-emerald-300 rounded-xs" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-500">Average Rating</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">4.2 / 5</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">
              ↑ 0.3 <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Bar Sparkline */}
          <div className="h-6 flex items-end gap-1 mt-3">
            {[40, 50, 60, 55, 70, 65, 80, 75, 85, 80, 90, 85, 95].map((v, i) => (
              <div key={i} className="flex-1 bg-amber-300 rounded-xs" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-500">Positive Feedback</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">72%</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">
              ↑ 8.1% <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Bar Sparkline */}
          <div className="h-6 flex items-end gap-1 mt-3">
            {[50, 55, 60, 65, 70, 68, 72, 75, 78, 80, 82, 85, 88].map((v, i) => (
              <div key={i} className="flex-1 bg-emerald-300 rounded-xs" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-500">Response Insights</div>
            <div className="text-lg font-black text-slate-900 tracking-tight mt-1">Top Mentions</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">Food, Service, Ambience</div>
          </div>
          <div className="flex gap-1.5 mt-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Food</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">Service</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">Ambience</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Rating Distribution, Feedback Trends, Feedback Sentiment Donut (Exact Match to Image 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Rating Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Breakdown of all feedback ratings.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 cursor-pointer">
              <span>All Feedback</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-3.5 my-2">
            {[
              { star: 5, pct: 52, count: 253, color: "bg-[#0F766E]" },
              { star: 4, pct: 28, count: 136, color: "bg-emerald-500" },
              { star: 3, pct: 12, count: 58, color: "bg-amber-400" },
              { star: 2, pct: 5, count: 24, color: "bg-orange-500" },
              { star: 1, pct: 3, count: 15, color: "bg-red-500" },
            ].map((row) => (
              <div key={row.star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
                  <Star className={`w-3.5 h-3.5 ${row.star >= 4 ? "text-emerald-600 fill-emerald-500" : row.star === 3 ? "text-amber-500 fill-amber-400" : "text-red-500 fill-red-400"}`} />
                  <span>{row.star} stars</span>
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
                <span className="w-16 text-right font-mono text-slate-500 text-[11px] shrink-0">
                  {row.pct}% ({row.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Trends Multi-Chart */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Feedback Trends</h2>
              <p className="text-xs text-slate-500 mt-0.5">Total feedback count and average rating over time.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 cursor-pointer">
              <span>Daily</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
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

          {/* Mini chart visual with tooltip on Mar 18 */}
          <div className="relative h-44 w-full">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white rounded-lg p-2 shadow-lg border border-slate-100 text-center text-xs z-10">
              <div className="text-[10px] text-slate-400 font-bold">Mar 18, 2025</div>
              <div className="font-extrabold text-slate-900">24 feedback</div>
              <div className="text-[10px] text-emerald-600 font-bold">★ 4.6 average</div>
            </div>

            <div className="h-32 flex items-end gap-1.5 pt-8">
              {[20, 25, 30, 45, 40, 60, 55, 75, 70, 85, 90, 80, 65, 75, 70, 60, 50, 65, 70, 60].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-200 hover:bg-emerald-400 rounded-t-xs transition"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-2">
              <span>Mar 1</span>
              <span>Mar 5</span>
              <span>Mar 10</span>
              <span>Mar 15</span>
              <span>Mar 20</span>
              <span>Mar 25</span>
              <span>Mar 31</span>
            </div>
          </div>
        </div>

        {/* Feedback Sentiment Donut Chart */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Feedback Sentiment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Overall sentiment from guest feedback.</p>
          </div>

          <div className="flex items-center justify-center my-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                {/* Positive 72% */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="4.5"
                  strokeDasharray="72 28"
                  strokeDashoffset="0"
                />
                {/* Neutral 18% */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="4.5"
                  strokeDasharray="18 82"
                  strokeDashoffset="-72"
                />
                {/* Negative 10% */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="4.5"
                  strokeDasharray="10 90"
                  strokeDashoffset="-90"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-slate-900 leading-tight">486</span>
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
              <span className="font-mono text-slate-900 font-bold">72% (351)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                <span className="font-semibold text-slate-700">Neutral</span>
              </div>
              <span className="font-mono text-slate-900 font-bold">18% (87)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span className="font-semibold text-slate-700">Negative</span>
              </div>
              <span className="font-mono text-slate-900 font-bold">10% (48)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Filterable List (Left 65%) + Common Topics (Right 35%) (Exact Match to Image 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Filterable Feedback List */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
          {/* Tabs: All, Positive, Neutral, Negative */}
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

            {/* Filter controls */}
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
                <option value="Food">Food</option>
                <option value="Service">Service</option>
                <option value="Ambience">Ambience</option>
              </select>
            </div>
          </div>

          {/* Feedback Items Feed */}
          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((item) => (
                <div key={item.id} className="py-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 p-2 rounded-xl transition">
                  <div className="space-y-1.5 flex-1">
                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
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
                    {/* Message */}
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.category && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {item.category}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
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
              <div className="py-12 text-center text-xs text-slate-400">
                No feedback matching your filters.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Common Topics + Growth Box */}
        <div className="space-y-6">
          {/* Common Feedback Topics Card */}
          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Common Feedback Topics</h2>
                <p className="text-xs text-slate-500 mt-0.5">Most mentioned keywords in feedback.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                View all
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: "Food", count: 124, pct: 100, icon: Utensils },
                { name: "Service", count: 98, pct: 80, icon: Users },
                { name: "Ambience", count: 76, pct: 62, icon: Sparkles },
                { name: "Staff", count: 64, pct: 52, icon: CheckCircle2 },
                { name: "Cleanliness", count: 38, pct: 31, icon: Sparkles },
                { name: "Price", count: 28, pct: 23, icon: DollarSign },
                { name: "Drinks", count: 24, pct: 19, icon: Coffee },
                { name: "Music", count: 21, pct: 17, icon: Music },
              ].map((topic) => {
                const Icon = topic.icon;
                return (
                  <div key={topic.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{topic.name}</span>
                      </div>
                      <span className="font-mono text-slate-900">{topic.count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0F766E]"
                        style={{ width: `${topic.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Turn feedback into growth" Box */}
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
    </div>
  );
}
