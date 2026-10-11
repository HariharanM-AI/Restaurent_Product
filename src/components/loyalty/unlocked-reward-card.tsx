"use client";

import React, { useState } from "react";
import { Gift, Check, Clock, Loader2, AlertCircle } from "lucide-react";
import { LoyaltyRewardData } from "@/types";
import { formatDisplayDate } from "@/lib/utils";

interface UnlockedRewardCardProps {
  reward: LoyaltyRewardData;
  brandColor?: string;
  onRedeemed?: () => void;
}

export function UnlockedRewardCard({
  reward,
  brandColor = "#0F766E",
  onRedeemed,
}: UnlockedRewardCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(reward.status === "REDEEMED");
  const [error, setError] = useState<string | null>(null);

  const handleRedeem = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/loyalty/rewards/${reward.id}/redeem`, {
        method: "POST",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRedeemed(true);
        setIsConfirming(false);
        if (onRedeemed) onRedeemed();
      } else {
        setError(json.error?.message || "Failed to redeem reward.");
      }
    } catch {
      setError("Network error while redeeming reward.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white/95 dark:bg-[#121927]/95 border border-slate-200/80 dark:border-white/[0.1] rounded-[22px] shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden backdrop-blur-xs">
      {/* Visual Voucher Notch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-amber-500/20">
            <Gift className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 block">
              Reward Voucher
            </span>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight tracking-tight mt-0.5">
              {reward.rewardTitle}
            </h4>
            {reward.rewardDescription && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                {reward.rewardDescription}
              </p>
            )}
            {reward.expiresAt && !redeemed && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires {formatDisplayDate(reward.expiresAt)}</span>
              </div>
            )}
          </div>
        </div>

        {redeemed ? (
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider shrink-0 border border-slate-200/60 dark:border-white/[0.06]">
            Redeemed
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-extrabold uppercase tracking-wider shrink-0 shadow-xs">
            Available
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3.5 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200/60 dark:border-red-800/40 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Redemption Action */}
      {!redeemed && (
        <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200 dark:border-white/[0.1]">
          {isConfirming ? (
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-700/40 text-center animate-in fade-in-50 duration-150">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                Show this to your server or cashier
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mb-3 font-medium">
                Tap confirm when presented to staff to claim your complimentary item.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isLoading}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>Confirm Redeem</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              <span>Redeem with Server</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
