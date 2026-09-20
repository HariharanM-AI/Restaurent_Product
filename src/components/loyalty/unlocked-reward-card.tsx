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
    <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm relative overflow-hidden">
      {/* Visual Voucher Notch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Reward Voucher
            </span>
            <h4 className="font-bold text-sm text-slate-900 leading-tight">
              {reward.rewardTitle}
            </h4>
            {reward.rewardDescription && (
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                {reward.rewardDescription}
              </p>
            )}
            {reward.expiresAt && !redeemed && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                <Clock className="w-3 h-3" />
                <span>Expires {formatDisplayDate(reward.expiresAt)}</span>
              </div>
            )}
          </div>
        </div>

        {redeemed ? (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider shrink-0">
            Redeemed
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
            Available
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Redemption Action */}
      {!redeemed && (
        <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
          {isConfirming ? (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center animate-in fade-in-50 duration-150">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                Show this to your server or cashier
              </p>
              <p className="text-[11px] text-amber-700 mb-3">
                Tap confirm when presented to staff to claim your complimentary item.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isLoading}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Redeem</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-sm transition flex items-center justify-center gap-1.5"
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
