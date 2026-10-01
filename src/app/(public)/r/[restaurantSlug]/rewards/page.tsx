"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Sparkles, QrCode, Gift, HelpCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics/tracker";
import { useLoyaltyWallet } from "@/hooks/use-loyalty-wallet";
import { StampCard } from "@/components/loyalty/stamp-card";
import { UnlockedRewardCard } from "@/components/loyalty/unlocked-reward-card";
import { StampScannerModal } from "@/components/loyalty/stamp-scanner-modal";

export default function RewardsPage() {
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [brandColor, setBrandColor] = useState("var(--brand-primary, #0F766E)");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/by-slug/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const rId = json.data.restaurant.id;
          setRestaurantId(rId);
          setRestaurantName(json.data.restaurant.name);
          setBrandColor(json.data.restaurant.primaryColor || "var(--brand-primary, #0F766E)");
          trackEvent({
            restaurantId: rId,
            eventType: "loyalty_open",
          });
        }
      })
      .catch(() => {});
  }, [slug]);

  const { wallet, isLoading, refetch } = useLoyaltyWallet(restaurantId);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/r/${slug}`}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">
          {restaurantName}
        </span>
        <div className="w-8" />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-4">
        {/* Page Title */}
        <div className="text-center py-2">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Rewards & Stamps</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect stamps on each visit to unlock complimentary favorites
          </p>
        </div>

        {/* Digital Stamp Card */}
        {isLoading ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
            Loading your stamp balance...
          </div>
        ) : wallet ? (
          <StampCard
            currentStamps={wallet.currentStamps}
            totalLifetimeStamps={wallet.totalLifetimeStamps}
            nextMilestone={wallet.nextMilestone || null}
            stampsNeeded={wallet.stampsNeededForNext || 0}
            restaurantName={restaurantName}
            brandColor={brandColor}
          />
        ) : null}

        {/* Scan QR Code to Collect Stamp Button */}
        <button
          type="button"
          onClick={() => setIsScanModalOpen(true)}
          className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition hover:opacity-95 active:scale-[0.99] cursor-pointer"
          style={{ backgroundColor: brandColor }}
        >
          <QrCode className="w-5 h-5" />
          <span>Scan QR to Collect Stamp</span>
        </button>

        {/* Unlocked Rewards Section */}
        {wallet && wallet.unlockedRewards && wallet.unlockedRewards.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Gift className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Unlocked Rewards ({wallet.unlockedRewards.filter((r) => r.status === "AVAILABLE").length})
              </h3>
            </div>
            <div className="space-y-3">
              {wallet.unlockedRewards.map((reward) => (
                <UnlockedRewardCard
                  key={reward.id}
                  reward={reward}
                  brandColor={brandColor}
                  onRedeemed={refetch}
                />
              ))}
            </div>
          </div>
        )}

        {/* How It Works Explainer Box */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <HelpCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>How to Collect Stamps</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            1. Tap the <strong>Scan QR to Collect Stamp</strong> button above to scan using your camera or enter the checkout code.
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            2. You can also point your phone camera directly at the single-use checkout QR code presented by staff.
          </p>
        </div>
      </div>

      {/* Stamp Scanner Modal */}
      {isScanModalOpen && (
        <StampScannerModal
          isOpen={isScanModalOpen}
          onClose={() => setIsScanModalOpen(false)}
          onSuccess={() => refetch()}
          restaurantId={restaurantId || ""}
          restaurantName={restaurantName}
          brandColor={brandColor}
        />
      )}
    </div>
  );
}
