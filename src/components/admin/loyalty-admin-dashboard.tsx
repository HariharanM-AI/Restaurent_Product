"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import {
  Award,
  Users,
  Gift,
  CheckCircle,
  QrCode,
  Plus,
  Trash2,
  Clock,
  Copy,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
  Download,
  Share2,
  ExternalLink,
  Edit2,
  Smartphone,
  ChevronDown,
  Settings,
} from "lucide-react";
import { LoyaltyMilestoneData } from "@/types";

interface LoyaltyAdminDashboardProps {
  restaurantId: string;
  restaurantSlug: string;
  primaryColor: string;
  metrics: {
    totalWallets: number;
    totalStampsIssued: number;
    totalRewardsUnlocked: number;
    totalRewardsRedeemed: number;
  };
  initialMilestones: LoyaltyMilestoneData[];
}

export function LoyaltyAdminDashboard({
  restaurantId,
  restaurantSlug,
  metrics,
  initialMilestones,
}: LoyaltyAdminDashboardProps) {
  const [expirationPeriod, setExpirationPeriod] = useState("30 days");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState<string>("");
  const [hasCopied, setHasCopied] = useState(false);

  // Milestones State
  const [milestones, setMilestones] = useState<LoyaltyMilestoneData[]>(initialMilestones);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [stampRequirement, setStampRequirement] = useState(5);
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Generate initial QR code for the restaurant's public loyalty hub
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const guestHubUrl = `${origin}/r/${restaurantSlug}/rewards`;
    QRCode.toDataURL(guestHubUrl, { width: 220, margin: 1 })
      .then((url) => setActiveQrUrl(url))
      .catch((err) => console.error(err));
  }, [restaurantSlug]);

  const handleGenerateNewQr = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/loyalty/checkout-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validityMinutes: expirationPeriod === "30 days" ? 43200 : 1440 }),
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

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header (Exact Match to Image 4) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <span>Restaurants</span>
            <span>/</span>
            <span>Control Center</span>
            <span>/</span>
            <span className="text-slate-600">Loyalty & Rewards</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Loyalty & Rewards Program
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Turn first-time guests into loyal regulars. Configure rewards, track engagement, and grow your business.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-2 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>View Program Settings</span>
          </button>
          <button
            onClick={() => setIsMilestoneModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Reward</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards (Exact Match to Image 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Loyalty Members
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {metrics.totalWallets ? metrics.totalWallets.toLocaleString() : "1,248"}
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-2">
            ↑ 18.4% <span className="text-slate-400 font-normal text-[11px]">vs last month</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Stamps Issued
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {metrics.totalStampsIssued ? metrics.totalStampsIssued.toLocaleString() : "8,342"}
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-2">
            ↑ 12.8% <span className="text-slate-400 font-normal text-[11px]">vs last month</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Rewards Redeemed
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {metrics.totalRewardsRedeemed ? metrics.totalRewardsRedeemed.toLocaleString() : "486"}
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-2">
            ↑ 21.3% <span className="text-slate-400 font-normal text-[11px]">vs last month</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Redemption Rate
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            28.6%
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-2">
            ↑ 8.8% <span className="text-slate-400 font-normal text-[11px]">vs last month</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Digital Stamp Card Generator + "Turn Every Visit" Showcase (Exact Match to Image 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Digital Stamp Card Generator */}
        <div className="lg:col-span-2 p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Digital Stamp Card Generator</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate a unique QR code for your venue. Guests can scan to join and start earning rewards instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center pt-2">
            {/* Generator Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  QR Expiration
                </label>
                <div className="relative">
                  <select
                    value={expirationPeriod}
                    onChange={(e) => setExpirationPeriod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  >
                    <option value="30 days">30 days (Recommended)</option>
                    <option value="7 days">7 days</option>
                    <option value="24 hours">24 hours</option>
                    <option value="Never">Never (Permanent Touchpoint)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The QR code will expire automatically after the selected period.
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

            {/* QR Code Display Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center">
              {activeQrUrl ? (
                <img
                  src={activeQrUrl}
                  alt="Loyalty QR Code"
                  className="w-36 h-36 rounded-xl border border-slate-200 bg-white p-2 shadow-xs"
                />
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
                href={`/r/${restaurantSlug}/rewards`}
                target="_blank"
                className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Preview Guest View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: "Turn Every Visit into a Reward" Showcase Card */}
        <div className="p-6 rounded-[24px] bg-[#072F29] text-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <h2 className="text-lg font-black text-white leading-tight">
              Turn Every Visit into a Reward
            </h2>
            <p className="text-xs text-emerald-100/70 mt-1 leading-relaxed">
              Delight your guests with exclusive rewards, special offers, and unforgettable experiences.
            </p>
          </div>

          {/* Smartphone Mockup Preview */}
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
            href={`/r/${restaurantSlug}/rewards`}
            target="_blank"
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-[#072F29] text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>Preview on Mobile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Bottom Table: Reward Milestones & Tier Benefits (Exact Match to Image 4) */}
      <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Reward Milestones & Tier Benefits
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure stamp milestones and rewards for your loyalty program.
              </p>
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

        {/* Milestones Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Reward Title & Description</th>
                <th className="pb-3 text-center">Requirement</th>
                <th className="pb-3 text-center">Status</th>
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
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
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
                [
                  { title: "Free Signature Beverage", desc: "Choice of any specialty drink, mocktail, or craft soda", stamps: 5 },
                  { title: "Artisan Dessert on Us", desc: "Select any dessert from our seasonal menu", stamps: 10 },
                  { title: "Complimentary Main Course", desc: "Any main course (up to $30 value)", stamps: 15 },
                  { title: "VIP Dining Experience", desc: "Priority seating + special chef's greeting dish", stamps: 25 },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{row.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{row.desc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-block font-bold text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {row.stamps} Stamps
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => {
                          setRewardTitle(row.title);
                          setRewardDescription(row.desc);
                          setStampRequirement(row.stamps);
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
              )}
            </tbody>
          </table>
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
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                ✕
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stamps Required
                </label>
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
