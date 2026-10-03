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
      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
        isFilled
          ? "shadow-sm"
          : "border-2 border-dashed border-slate-200 bg-slate-50/70 text-slate-400"
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
            <Award className="w-5 h-5 text-amber-300" />
          ) : (
            <Check className="w-5 h-5 stroke-[2.5]" />
          )}
          <span className="text-[9px] font-bold tracking-tight uppercase opacity-90 mt-0.5">
            Visit {displayNum}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-bold font-mono text-slate-400">
            {displayNum}
          </span>
          {isMilestone && (
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter mt-0.5">
              Reward
            </span>
          )}
        </div>
      )}
    </div>
  );
}
