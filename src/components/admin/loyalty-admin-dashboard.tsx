"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { subscribeToActivity } from "@/lib/realtime/broadcast";
import {
  Award,
  Users,
  Gift,
  QrCode,
  Plus,
  Clock,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Download,
  Share2,
  ExternalLink,
  Edit2,
  ChevronDown,
  Calendar,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { LoyaltyMilestoneData } from "@/types";

/* ─── Types ─── */
interface LoyaltyStatsData {
  period: string;
  kpis: {
    members: { current: number; total: number; change: number };
    stamps: { current: number; total: number; change: number };
    redeemed: { current: number; total: number; change: number };
    redemptionRate: number;
    milestones: { current: number; change: number };
  };
  timeSeries: { date: string; stamps: number }[];
  rewardStatus: { available: number; redeemed: number; expired: number };
  recentActivity: {
    id: string;
    type: string;
    quantity: number;
    customerName: string;
    createdAt: string;
    description: string;
  }[];
}

interface LoyaltyAdminDashboardProps {
  restaurantId: string;
  restaurantSlug: string;
  primaryColor: string;
  initialMilestones: LoyaltyMilestoneData[];
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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
export function LoyaltyAdminDashboard({
  restaurantId,
  restaurantSlug,
  initialMilestones,
}: LoyaltyAdminDashboardProps) {
  // Date filter state
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Data state
  const [stats, setStats] = useState<LoyaltyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR state
  const [expirationPeriod, setExpirationPeriod] = useState("30 days");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState<string>("");
  const [hasCopied, setHasCopied] = useState(false);

  // Milestones state
  const [milestones, setMilestones] = useState<LoyaltyMilestoneData[]>(initialMilestones);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [stampRequirement, setStampRequirement] = useState(5);
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Generate initial QR code
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const guestHubUrl = `${origin}/r/${restaurantSlug}/rewards`;
    QRCode.toDataURL(guestHubUrl, { width: 220, margin: 1 })
      .then((url) => setActiveQrUrl(url))
      .catch((err) => console.error(err));
  }, [restaurantSlug]);

  // Fetch stats
  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);
    try {
      let url = `/api/restaurants/${restaurantId}/loyalty/stats?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        if (!isSilent) setError(json.error || "Unknown error");
      }
    } catch {
      if (!isSilent) setError("Unable to load loyalty data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [restaurantId, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchStats();
  }, [fetchStats, period, customFrom, customTo]);

  // Real-time synchronization whenever guests claim stamps or interact
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

  const handleGenerateNewQr = async () => {
    setIsGenerating(true);
    try {
      // Map expiration period to minutes
      let validityMinutes: number;
      switch (expirationPeriod) {
        case "immediate":
          validityMinutes = 0; // One-time scan, expires immediately after use
          break;
        case "24 hours":
          validityMinutes = 1440;
          break;
        case "7 days":
          validityMinutes = 10080;
          break;
        case "30 days":
          validityMinutes = 43200;
          break;
        case "Never":
          validityMinutes = -1; // Permanent
          break;
        default:
          validityMinutes = 43200;
      }
      const res = await fetch(`/api/restaurants/${restaurantId}/loyalty/checkout-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validityMinutes }),
      });
      const data = await res.json();
      if (data.success && data.data?.claimUrl) {
        const qr = await QRCode.toDataURL(data.data.claimUrl, { width: 220, margin: 1 });
        setActiveQrUrl(qr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMilestone(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/loyalty/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stampRequirement: Number(stampRequirement),
          rewardTitle,
          rewardDescription,
          validityDays: 30,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMilestones([...milestones, data.data]);
        setIsMilestoneModalOpen(false);
        setRewardTitle("");
        setRewardDescription("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "30 Days";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-1">
            <span>Restaurants</span>
            <span>/</span>
            <span>Control Center</span>
            <span>/</span>
            <span className="text-slate-600">Loyalty & Rewards</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Loyalty & Rewards Program
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {loading
              ? "Loading loyalty data..."
              : `Turn first-time guests into loyal regulars — ${periodLabel}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMilestoneModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Reward</span>
          </button>
        </div>
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

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => fetchStats()} className="ml-auto text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Real Data */}
      {stats && (
        <>
          {/* 3. KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-emerald-50 text-emerald-700"
              label="Loyalty Members"
              value={fmt(stats.kpis.members.total)}
              periodValue={stats.kpis.members.current}
              change={stats.kpis.members.change}
            />
            <KPICard
              icon={<Award className="w-5 h-5" />}
              iconBg="bg-blue-50 text-blue-700"
              label="Stamps Issued"
              value={fmt(stats.kpis.stamps.total)}
              periodValue={stats.kpis.stamps.current}
              change={stats.kpis.stamps.change}
            />
            <KPICard
              icon={<Gift className="w-5 h-5" />}
              iconBg="bg-amber-50 text-amber-700"
              label="Rewards Redeemed"
              value={fmt(stats.kpis.redeemed.total)}
              periodValue={stats.kpis.redeemed.current}
              change={stats.kpis.redeemed.change}
            />
            <KPICard
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-purple-50 text-purple-700"
              label="Redemption Rate"
              value={`${stats.kpis.redemptionRate}%`}
              periodValue={null}
              change={0}
            />
          </div>

          {/* 4. Stamps Chart + Reward Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stamps Time-Series Chart */}
            <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Stamps Activity</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Stamps issued over time</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                    Stamps earned
                  </span>
                </div>
              </div>

              <StampsChart timeSeries={stats.timeSeries} />
            </div>

            {/* Reward Status Card */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 mb-1">Reward Status</h2>
                <p className="text-xs text-slate-500 mb-4">Breakdown of all rewards</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Available", count: stats.rewardStatus.available, color: "bg-emerald-500" },
                  { label: "Redeemed", count: stats.rewardStatus.redeemed, color: "bg-blue-500" },
                  { label: "Expired", count: stats.rewardStatus.expired, color: "bg-slate-400" },
                ].map((item) => {
                  const total = stats.rewardStatus.available + stats.rewardStatus.redeemed + stats.rewardStatus.expired || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-mono text-slate-900 font-bold">
                          {item.count} <span className="text-slate-400 font-normal">{pct}%</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
                Total rewards: <strong className="text-slate-900">
                  {(stats.rewardStatus.available + stats.rewardStatus.redeemed + stats.rewardStatus.expired).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. QR Generator + Showcase (always visible, not data-dependent) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Generator */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Digital Stamp Card Generator</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate a unique QR code. Guests scan to join and start earning rewards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center pt-2">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">QR Expiration</label>
                <div className="relative">
                  <select
                    value={expirationPeriod}
                    onChange={(e) => setExpirationPeriod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  >
                    <option value="30 days">30 days (Recommended)</option>
                    <option value="7 days">7 days</option>
                    <option value="24 hours">24 hours</option>
                    <option value="immediate">Immediate (One-Time Scan)</option>
                    <option value="Never">Never (Permanent Touchpoint)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {expirationPeriod === "immediate"
                    ? "This QR code will be invalidated after a single scan."
                    : "The QR code will expire automatically after the selected period."}
                </p>
              </div>

              <button
                onClick={handleGenerateNewQr}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                <span>Generate New QR Code</span>
              </button>
            </div>

            {/* QR Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
              {activeQrUrl ? (
                <img src={activeQrUrl} alt="Loyalty QR Code" className="w-36 h-36 rounded-xl border border-slate-200 bg-white p-2 shadow-xs" />
              ) : (
                <div className="w-36 h-36 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}
              <div className="mt-2 text-xs font-bold text-slate-900">Scan to Join</div>
              <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px]">
                Let your guests scan this QR code to join your loyalty program.
              </p>

              <div className="mt-3 flex items-center gap-2 w-full">
                <a
                  href={activeQrUrl}
                  download={`loyalty-qr-${restaurantSlug}.png`}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => {
                    if (navigator.share && activeQrUrl) {
                      navigator.share({ title: "Loyalty Program", url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      setHasCopied(true);
                      setTimeout(() => setHasCopied(false), 1500);
                    }
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {hasCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-slate-500" />}
                  <span>{hasCopied ? "Copied" : "Share"}</span>
                </button>
              </div>

              <Link
                href={`/r/${restaurantSlug}/rewards?preview=true`}
                target="_blank"
                className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Preview Guest View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Showcase Card */}
        <div className="p-6 rounded-[24px] bg-[#072F29] text-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <h2 className="text-lg font-black text-white leading-tight">Turn Every Visit into a Reward</h2>
            <p className="text-xs text-emerald-100/70 mt-1 leading-relaxed">
              Delight your guests with exclusive rewards, special offers, and unforgettable experiences.
            </p>
          </div>

          <div className="my-4 mx-auto w-44 rounded-2xl bg-black/40 border-2 border-emerald-500/30 p-2.5 shadow-2xl">
            <div className="rounded-xl bg-white text-slate-900 p-3 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-1 font-bold text-xs">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-bold">Stamp Card</div>
              <div className="flex justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      s <= 3 ? "bg-[#0F766E] text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="text-[9px] text-slate-400">2 stamps away from Free Drink</div>
            </div>
          </div>

          <Link
            href={`/r/${restaurantSlug}/rewards?preview=true`}
            target="_blank"
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-[#072F29] text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>Preview on Mobile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6. Recent Activity + Milestones Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        {stats && (
          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest loyalty transactions</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.recentActivity.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-6">No recent activity</div>
              )}
              {stats.recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {item.type === "STAMP_EARNED" && <Award className="w-4 h-4 text-emerald-700 shrink-0" />}
                    {item.type === "MILESTONE_UNLOCKED" && <Gift className="w-4 h-4 text-amber-600 shrink-0" />}
                    {item.type === "REWARD_REDEEMED" && <Gift className="w-4 h-4 text-purple-600 shrink-0" />}
                    {item.type === "STAMP_REVERSED" && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    {!["STAMP_EARNED", "MILESTONE_UNLOCKED", "REWARD_REDEEMED", "STAMP_REVERSED"].includes(item.type) && (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-700">{item.description}</div>
                      <div className="text-[10px] text-slate-400">{item.customerName}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">{timeAgo(item.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones Table */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Reward Milestones & Tier Benefits</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure stamp milestones and rewards.</p>
              </div>
            </div>

            <button
              onClick={() => setIsMilestoneModalOpen(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Reward Title & Description</th>
                  <th className="pb-3 text-center">Requirement</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {milestones.length > 0 ? (
                  milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Gift className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{m.rewardTitle}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {m.rewardDescription || "Special patron reward"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="inline-block font-bold text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {m.stampRequirement} Stamps
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => {
                            setRewardTitle(m.rewardTitle);
                            setRewardDescription(m.rewardDescription || "");
                            setStampRequirement(m.stampRequirement);
                            setIsMilestoneModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                      No milestones configured yet. Click "Add Milestone" to create your first reward tier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Configure Milestone Reward</h3>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reward Title</label>
                <input
                  type="text"
                  required
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="e.g. Free House Dessert"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="e.g. Choice of any artisan dessert"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stamps Required</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={stampRequirement}
                  onChange={(e) => setStampRequirement(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMilestone}
                  className="px-4 py-2 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold transition flex items-center gap-2"
                >
                  {isSubmittingMilestone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Milestone</span>
                </button>
              </div>
            </form>
          </div>
        </div>
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
  periodValue,
  change,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  periodValue: number | null;
  change: number;
}) {
  const isPositive = change >= 0;
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">{value}</div>
      {change !== 0 ? (
        <div className={`text-xs font-bold mt-2 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%{" "}
          <span className="text-slate-400 font-normal text-[11px]">vs previous period</span>
          {periodValue !== null && (
            <span className="text-slate-400 font-normal text-[11px] ml-1">({periodValue} in period)</span>
          )}
        </div>
      ) : (
        <div className="text-xs font-bold text-slate-400 mt-2">No previous data</div>
      )}
    </div>
  );
}

/* ─── Stamps Chart ─── */
function StampsChart({ timeSeries }: { timeSeries: { date: string; stamps: number }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = timeSeries.map((d) => d.stamps);
  const maxVal = Math.max(...data, 1);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        No stamp activity in this period
      </div>
    );
  }

  // Use bar chart for stamp data
  const barWidth = Math.max(2, Math.min(20, 500 / data.length));

  // Show ~7 date labels
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
    <div>
      <div className="h-48 flex items-end gap-[2px] relative" onMouseLeave={() => setHoveredIdx(null)}>
        {data.map((val, idx) => (
          <div
            key={idx}
            className="flex-1 relative group cursor-pointer"
            style={{ height: "100%" }}
            onMouseEnter={() => setHoveredIdx(idx)}
          >
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-t-xs transition-all ${
                hoveredIdx === idx ? "bg-emerald-700" : "bg-emerald-500"
              }`}
              style={{ height: `${Math.max((val / maxVal) * 100, 1)}%` }}
            />

            {/* Tooltip */}
            {hoveredIdx === idx && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg p-2 shadow-xl border border-slate-100 z-20 pointer-events-none whitespace-nowrap">
                <div className="text-[10px] font-bold text-slate-400">
                  {new Date(timeSeries[idx].date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs font-black text-slate-900">{val} stamps</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* X Axis */}
      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-1">
        {dateLabels.map((dl) => (
          <span key={dl.idx}>{dl.label}</span>
        ))}
      </div>
    </div>
  );
}
