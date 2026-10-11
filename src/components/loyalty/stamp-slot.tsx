"use client";

import React from "react";
import { Check, Award } from "lucide-react";

interface StampSlotProps {
  index: number;
  visitNumber?: number;
  isFilled: boolean;
  isMilestone?: boolean;
  brandColor?: string;
}

export function StampSlot({
  index,
  visitNumber,
  isFilled,
  isMilestone = false,
  brandColor = "#0F766E",
}: StampSlotProps) {
  const displayNum = visitNumber ?? index + 1;

  return (
    <div
      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all select-none overflow-hidden ${
        isFilled
          ? "shadow-sm ring-1 ring-white/20 dark:ring-white/10"
          : isMilestone
          ? "border-2 border-dashed border-amber-400/70 dark:border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
          : "border-2 border-dashed border-slate-200/90 dark:border-white/[0.12] bg-slate-50/70 dark:bg-white/[0.03] text-slate-400 dark:text-slate-500"
      }`}
      style={
        isFilled
          ? {
              backgroundColor: brandColor,
              color: "#FFFFFF",
            }
          : undefined
      }
      aria-label={`Stamp ${displayNum}: ${isFilled ? "earned" : "unearned"}`}
    >
      {isFilled ? (
        <div className="flex flex-col items-center justify-center animate-stamp-pop">
          {isMilestone ? (
            <Award className="w-5 h-5 text-amber-300 drop-shadow-xs" />
          ) : (
            <Check className="w-5 h-5 stroke-[2.5]" />
          )}
          <span className="text-[9px] font-extrabold tracking-tight uppercase opacity-95 mt-0.5">
            Visit {displayNum}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-black font-mono">
            {displayNum}
          </span>
          {isMilestone && (
            <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-tighter mt-0.5">
              Reward
            </span>
          )}
        </div>
      )}
    </div>
  );
}
