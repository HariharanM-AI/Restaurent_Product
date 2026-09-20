"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Gift, Loader2 } from "lucide-react";

export default function ClaimTokenPage() {
  const params = useParams();
  const rawToken = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [claimData, setClaimData] = useState<{
    restaurantName: string;
    restaurantSlug: string;
    primaryColor: string;
    stampEarned: number;
    currentStamps: number;
    lifetimeStamps: number;
    newReward?: {
      rewardTitle: string;
      rewardDescription?: string | null;
    } | null;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Generate or retrieve browser wallet ID
    let browserId = localStorage.getItem("guestlink_loyalty_browser_id");
    if (!browserId) {
      browserId = "wal_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      localStorage.setItem("guestlink_loyalty_browser_id", browserId);
    }

    const idempotencyKey = `claim_${rawToken}_${browserId}`;

    fetch(`/api/loyalty/checkout/${rawToken}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousBrowserId: browserId,
        idempotencyKey,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setClaimData(json.data);
        } else {
          setErrorMessage(json.error?.message || "This checkout QR is invalid, consumed, or expired.");
        }
      })
      .catch(() => {
        setErrorMessage("Network error while validating checkout token.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [rawToken]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
            <h2 className="text-base font-bold text-slate-900">Validating Checkout Stamp...</h2>
            <p className="text-xs text-slate-400 mt-1">Connecting to restaurant ledger</p>
          </div>
        ) : errorMessage ? (
          <div className="py-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">Stamp Unavailable</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{errorMessage}</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Return to Home
            </Link>
          </div>
        ) : claimData ? (
          <div className="py-4">
            {/* Stamp Pop Animation Badge */}
            <div
              className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg animate-stamp-pop"
              style={{ backgroundColor: claimData.primaryColor || "#0F766E" }}
            >
              <Award className="w-10 h-10 text-amber-300" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
              Checkout Confirmed
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              Stamp Added!
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Thank you for dining with <strong className="text-slate-800">{claimData.restaurantName}</strong>.
            </p>

            {/* Current Stamp Count Indicator */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Your Updated Balance
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {claimData.currentStamps}
                </span>
                <span className="text-xs font-semibold text-slate-600">Active Stamps</span>
              </div>
            </div>

            {/* If New Reward Unlocked */}
            {claimData.newReward && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                  <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>New Reward Unlocked!</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  {claimData.newReward.rewardTitle}
                </h4>
                {claimData.newReward.rewardDescription && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {claimData.newReward.rewardDescription}
                  </p>
                )}
              </div>
            )}

            <Link
              href={`/r/${claimData.restaurantSlug}/rewards`}
              className="w-full py-3.5 px-4 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
              style={{ backgroundColor: claimData.primaryColor || "#0F766E" }}
            >
              <span>View My Rewards Card</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
