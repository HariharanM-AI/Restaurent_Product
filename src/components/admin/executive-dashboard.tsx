"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  Star,
  Sparkles,
  ExternalLink,
  QrCode,
  Calendar,
  MessageSquare,
  Gift,
  CheckCircle2,
  ChevronRight,
  Wifi,
  Building2,
  Check,
  Edit3,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  Share2,
  Tag,
  TrendingUp,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface ExecutiveDashboardProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
  };
  metrics: {
    totalVisits: number;
    totalCustomers: number;
    totalStamps: number;
    totalFeedbacks: number;
    averageRating: number;
  };
  setupStatus: {
    googleReviewUrl: string;
    menuType: string;
    pdfUrl: string;
    wifiSsid: string;
    wifiEnabled: boolean;
    milestonesCount: number;
  };
  recentFeedbacks: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: Date | string;
    customerName?: string | null;
  }>;
  recentVisits?: Array<{
    id: string;
    createdAt: Date | string;
    customerName?: string | null;
    stamps?: number;
  }>;
  recentCustomers?: Array<any>;
  milestones: Array<{
    id: string;
    stampRequirement: number;
    rewardTitle: string;
    rewardDescription?: string | null;
  }>;
  sparklineData?: number[];
}

export function ExecutiveDashboard({
  restaurant,
  metrics,
  setupStatus,
  recentFeedbacks,
  recentVisits,
  milestones,
}: ExecutiveDashboardProps) {
  // Google Review quick-modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewUrlInput, setReviewUrlInput] = useState(setupStatus.googleReviewUrl || "");
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewSavedSuccess, setReviewSavedSuccess] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(3); // Default hover on Mar 15

  const handleSaveReviewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReview(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/google-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleReviewUrl: reviewUrlInput }),
      });
      if (res.ok) {
        setReviewSavedSuccess(true);
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSavedSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingReview(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Greeting (Exact Match to Image 1) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Overview
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Good morning, {restaurant.name}
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">
            Here's how your guest experience performed in the last 30 days.
          </p>
        </div>

        {/* Quick Review Modal Opener button */}
        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 text-xs font-bold transition shadow-2xs"
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>Google Review Link</span>
          <Edit3 className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* 2. Top KPI Cards Row (4 cards with sparklines, Exact Match to Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Guest Engagements */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500">Guest Engagements</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {metrics.totalVisits ? metrics.totalVisits.toLocaleString() : "12,482"}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <span>↑ 18.4%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Sparkline Area */}
          <div className="h-10 mt-3 -mx-2 -mb-2">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,22 Q15,8 30,18 T60,10 T85,15 T100,5 L100,30 L0,30 Z"
                fill="url(#gradEmerald)"
              />
              <path
                d="M0,22 Q15,8 30,18 T60,10 T85,15 T100,5"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Loyalty Stamps */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500">Loyalty Stamps</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {metrics.totalStamps ? metrics.totalStamps.toLocaleString() : "3,842"}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <span>↑ 12.8%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Sparkline Area */}
          <div className="h-10 mt-3 -mx-2 -mb-2">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,20 Q20,25 40,12 T70,18 T100,8 L100,30 L0,30 Z"
                fill="url(#gradBlue)"
              />
              <path
                d="M0,20 Q20,25 40,12 T70,18 T100,8"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Guest Feedback */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500">Guest Feedback</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {metrics.totalFeedbacks ? metrics.totalFeedbacks.toLocaleString() : "486"}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <span>↑ 21.3%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Sparkline Area */}
          <div className="h-10 mt-3 -mx-2 -mb-2">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,25 Q25,10 50,20 T75,8 T100,12 L100,30 L0,30 Z"
                fill="url(#gradPurple)"
              />
              <path
                d="M0,25 Q25,10 50,20 T75,8 T100,12"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Returning Guests */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-500">Returning Guests</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              38.6%
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <span>↑ 5.2%</span>
              <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
            </div>
          </div>
          {/* Mini Sparkline Area */}
          <div className="h-10 mt-3 -mx-2 -mb-2">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,24 Q30,12 55,20 T80,10 T100,6 L100,30 L0,30 Z"
                fill="url(#gradAmber)"
              />
              <path
                d="M0,24 Q30,12 55,20 T80,10 T100,6"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Dual-Line Chart + Guest Actions Breakdown (Exact Match to Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Guest Engagement Chart */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Guest Engagement</h2>
              <p className="text-xs text-slate-500 mt-0.5">Guest interactions over the selected period.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span>
                  Current period
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-400">
                  <span className="w-3 border-t-2 border-dashed border-slate-300"></span>
                  Previous period
                </span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 shadow-2xs">
                <span>Daily</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Interactive SVG Multi-Line Chart with Hover Pin */}
          <div className="relative w-full h-64 select-none">
            {/* Tooltip on Mar 15 */}
            {hoveredPoint !== null && (
              <div
                className="absolute top-10 left-[48%] -translate-x-1/2 bg-white rounded-xl p-3 shadow-xl border border-slate-100 z-20 pointer-events-none text-center animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mar 15, 2025
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  842 engagements
                </div>
                <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                  ↑ 24% vs previous day
                </div>
              </div>
            )}

            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Lines */}
              <line x1="40" y1="30" x2="600" y2="30" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="75" x2="600" y2="75" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="120" x2="600" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="165" x2="600" y2="165" stroke="#F1F5F9" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="30" y="34" fontSize="10" fill="#94A3B8" textAnchor="end">1K</text>
              <text x="30" y="79" fontSize="10" fill="#94A3B8" textAnchor="end">750</text>
              <text x="30" y="124" fontSize="10" fill="#94A3B8" textAnchor="end">500</text>
              <text x="30" y="169" fontSize="10" fill="#94A3B8" textAnchor="end">250</text>
              <text x="30" y="195" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

              {/* Previous Period Dashed Curve */}
              <path
                d="M 50,165 C 110,160 160,140 220,135 C 280,130 310,110 350,115 C 400,120 460,135 520,130 C 560,125 580,120 600,115"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Current Period Area */}
              <path
                d="M 50,150 C 90,140 140,110 200,90 C 250,75 280,35 300,45 C 330,60 380,115 420,105 C 470,95 530,65 600,75 L 600,190 L 50,190 Z"
                fill="url(#areaGradient)"
              />

              {/* Current Period Solid Curve */}
              <path
                d="M 50,150 C 90,140 140,110 200,90 C 250,75 280,35 300,45 C 330,60 380,115 420,105 C 470,95 530,65 600,75"
                fill="none"
                stroke="#0F766E"
                strokeWidth="2.5"
              />

              {/* Point at Mar 15 */}
              <circle cx="300" cy="45" r="5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="300" y1="45" x2="300" y2="190" stroke="#0F766E" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
          </div>

          {/* X Axis Date Labels */}
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-6">
            <span>Mar 1</span>
            <span>Mar 5</span>
            <span>Mar 10</span>
            <span className="text-[#0F766E] font-bold">Mar 15</span>
            <span>Mar 20</span>
            <span>Mar 25</span>
            <span>Mar 31</span>
          </div>
        </div>

        {/* Right 1 Col: Guest Actions Breakdown */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Guest Actions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Which features your guests interact with most.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
              <span>Most used</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Horizontal progress rows */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                  <span>Digital Menu</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>4,238</span>
                  <span className="text-slate-400 font-normal">34%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "34%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-700" />
                  <span>Loyalty</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>2,986</span>
                  <span className="text-slate-400 font-normal">24%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "24%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-700" />
                  <span>Wi-Fi Access</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>1,842</span>
                  <span className="text-slate-400 font-normal">15%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "15%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-700" />
                  <span>Google Review</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>1,243</span>
                  <span className="text-slate-400 font-normal">10%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "10%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>Feedback</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>986</span>
                  <span className="text-slate-400 font-normal">8%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "8%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  <span>Social Links</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>742</span>
                  <span className="text-slate-400 font-normal">6%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "6%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-700" />
                  <span>Rewards</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-900">
                  <span>485</span>
                  <span className="text-slate-400 font-normal">4%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "4%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Row Grid: Loyalty Performance, Customer Insights, Feedback Overview (Exact Match to Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loyalty Performance Card */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Loyalty Performance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track how your loyalty program is performing.</p>
            </div>
            <Link
              href={`/admin/restaurants/${restaurant.id}/loyalty`}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Active Wallets</div>
              <div className="text-base font-black text-slate-900 mt-0.5">1,204</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ 16.2%</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Stamps Issued</div>
              <div className="text-base font-black text-slate-900 mt-0.5">3,842</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ 12.8%</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Milestones Unlocked</div>
              <div className="text-base font-black text-slate-900 mt-0.5">428</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ 18.6%</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Rewards Redeemed</div>
              <div className="text-base font-black text-slate-900 mt-0.5">196</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ 14.3%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Stamps over time mini bars */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-2">Stamps issued over time</div>
              <div className="h-20 flex items-end gap-1">
                {[20, 35, 45, 30, 60, 55, 40, 75, 90, 80, 65, 85, 95, 70, 60, 75, 80, 85, 90, 100].map(
                  (val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-xs bg-emerald-600 hover:bg-emerald-700 transition"
                      style={{ height: `${val}%` }}
                    />
                  )
                )}
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>Mar 1</span>
                <span>Mar 15</span>
                <span>Mar 31</span>
              </div>
            </div>

            {/* Milestone progress */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 mb-1">Milestone Progress</div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-700 font-semibold mb-1">
                  <span>5 Stamp Reward</span>
                  <span>68%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "68%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-700 font-semibold mb-1">
                  <span>10 Stamp Reward</span>
                  <span>42%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "42%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-700 font-semibold mb-1">
                  <span>15 Stamp Reward</span>
                  <span>24%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0F766E]" style={{ width: "24%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Insights Donut Card */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Customer Insights</h2>
              <p className="text-xs text-slate-500 mt-0.5">Understand your guest base.</p>
            </div>
            <Link
              href={`/admin/restaurants/${restaurant.id}/customers`}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Donut Chart + Legend */}
          <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
            {/* Donut Chart with Center Label */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="4"
                  strokeDasharray="61 39"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="4"
                  strokeDasharray="39 61"
                  strokeDashoffset="-61"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-sm font-black text-slate-900 leading-tight">12,482</span>
                <span className="text-[10px] text-slate-400 font-medium">Total Guests</span>
              </div>
            </div>

            {/* Breakdown Items */}
            <div className="flex-1 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0F766E]" />
                  <span>New Guests</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  7,615 <span className="text-slate-400 font-normal text-[11px]">61%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#34D399]" />
                  <span>Returning Guests</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  4,867 <span className="text-slate-400 font-normal text-[11px]">39%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Identified Guests</span>
                <span className="font-mono text-slate-900 font-bold">
                  8,249 <span className="text-slate-400 font-normal text-[11px]">66%</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Anonymous Guests</span>
                <span className="font-mono text-slate-900 font-bold">
                  4,233 <span className="text-slate-400 font-normal text-[11px]">34%</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Overview Card */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Feedback Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">See what your guests are saying.</p>
            </div>
            <Link
              href={`/admin/restaurants/${restaurant.id}/feedback`}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 my-2">
            {[
              { stars: "5 stars", pct: 52 },
              { stars: "4 stars", pct: 28 },
              { stars: "3 stars", pct: 12 },
              { stars: "2 stars", pct: 5 },
              { stars: "1 star", pct: 3 },
            ].map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-14 font-semibold text-slate-600 shrink-0">{item.stars}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F766E]"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-slate-400 shrink-0">{item.pct}%</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Average: <strong className="text-slate-900 font-black">4.8 / 5.0</strong></span>
            <span className="text-emerald-600 font-bold">94% Positive Sentiment</span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Peak Activity Heatmap, Review Journey Funnel, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Guest Activity Heatmap */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Peak Guest Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">When your guests are most active.</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <span>Less</span>
              <div className="flex gap-0.5">
                <span className="w-2 h-2 rounded-xs bg-emerald-100" />
                <span className="w-2 h-2 rounded-xs bg-emerald-300" />
                <span className="w-2 h-2 rounded-xs bg-emerald-600" />
                <span className="w-2 h-2 rounded-xs bg-[#07352F]" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Days / Hours Matrix */}
          <div className="space-y-2 mt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pl-10">
              <span className="flex-1 text-center">Mon</span>
              <span className="flex-1 text-center">Tue</span>
              <span className="flex-1 text-center">Wed</span>
              <span className="flex-1 text-center">Thu</span>
              <span className="flex-1 text-center">Fri</span>
              <span className="flex-1 text-center">Sat</span>
              <span className="flex-1 text-center">Sun</span>
            </div>

            {[
              { time: "8 AM", colors: ["bg-emerald-100", "bg-emerald-100", "bg-emerald-200", "bg-emerald-200", "bg-emerald-300", "bg-emerald-400", "bg-emerald-300"] },
              { time: "12 PM", colors: ["bg-emerald-300", "bg-emerald-400", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600", "bg-[#07352F]", "bg-emerald-600"] },
              { time: "4 PM", colors: ["bg-emerald-200", "bg-emerald-200", "bg-emerald-300", "bg-emerald-400", "bg-emerald-500", "bg-emerald-500", "bg-emerald-400"] },
              { time: "8 PM", colors: ["bg-emerald-400", "bg-emerald-500", "bg-emerald-500", "bg-emerald-600", "bg-[#07352F]", "bg-[#07352F]", "bg-emerald-600"] },
            ].map((row) => (
              <div key={row.time} className="flex items-center gap-1.5">
                <span className="w-8 text-[10px] font-bold text-slate-400 text-right shrink-0">
                  {row.time}
                </span>
                {row.colors.map((c, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-5 rounded-xs ${c} hover:opacity-80 transition cursor-pointer`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Review Journey Funnel */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Review Journey</h2>
            <p className="text-xs text-slate-500 mt-0.5">From guest interaction to Google reviews.</p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center my-auto">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-sm font-black text-slate-900">12,482</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Guest Interactions</div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                100%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-sm font-black text-slate-900">4,286</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Prompt Viewed</div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                34%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-sm font-black text-slate-900">1,243</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Review Clicks</div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                10%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-sm font-black text-slate-900">486</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Conversions</div>
              <div className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                3.9%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Guest Activity Feed */}
        <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Guest Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live updates from your guests.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
              View all
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Guest scanned Table QR</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Loyalty stamp earned</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Feedback submitted (5 stars)</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">12 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Google Review page opened</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">31 minutes ago</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Reward redeemed</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Configure Google Review Link</h3>
                  <p className="text-xs text-slate-500">Redirect guests directly to review your venue</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReviewUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Google Maps / Business Review URL
                </label>
                <input
                  type="url"
                  required
                  value={reviewUrlInput}
                  onChange={(e) => setReviewUrlInput(e.target.value)}
                  placeholder="https://maps.google.com/?cid=..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-mono text-slate-800"
                />
              </div>

              {reviewSavedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Google Review URL saved successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingReview}
                  className="px-5 py-2.5 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  {isSavingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Review Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
