"use client";

import { getCycleLength } from "@/lib/loyalty/ledger";
import React from "react";
import { Award } from "lucide-react";
import { StampSlot } from "./stamp-slot";
import { LoyaltyMilestoneData } from "@/types";

interface StampCardProps {
  currentStamps: number;
  totalLifetimeStamps: number;
  nextMilestone: LoyaltyMilestoneData | null;
  stampsNeeded: number;
  restaurantName: string;
  brandColor?: string;
  milestones?: LoyaltyMilestoneData[];
}

export function StampCard({
  currentStamps,
  totalLifetimeStamps,
  nextMilestone,
  stampsNeeded,
  restaurantName,
  brandColor = "var(--brand-primary, #0F766E)",
  milestones = [],
}: StampCardProps) {
  // Same cycle as the server's reward logic, so card slots match exactly where rewards unlock
  const activeMilestones = milestones.filter((m) => m.enabled !== false);
  const cycleLength = getCycleLength(milestones);
  const cardCapacity = cycleLength || 10; // no rewards configured: a plain 10-slot card, no reward markers

  // Keep the just-completed card visible on the scan that finishes it
  const cycleIndex = totalLifetimeStamps === 0 ? 0 : Math.floor((totalLifetimeStamps - 1) / cardCapacity);
  const baseOffset = cycleIndex * cardCapacity;
  const milestoneRequirementsInCycle = activeMilestones.map((m) => baseOffset + m.stampRequirement);
  const maxMilestoneReq = cardCapacity;

  // Dynamic target stamp requirement for upcoming reward
  const targetRewardStamp =
    nextMilestone?.stampRequirement ??
    milestoneRequirementsInCycle.find((req) => req > totalLifetimeStamps) ??
    (baseOffset + maxMilestoneReq);

  const displayStampsNeeded =
    stampsNeeded > 0
      ? stampsNeeded
      : Math.max(0, targetRewardStamp - totalLifetimeStamps);

  const isHex = brandColor.startsWith("#");
  const badgeBg = isHex ? `${brandColor}18` : "color-mix(in srgb, var(--brand-primary) 15%, transparent)";

  return (
    <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2B]/95 border border-slate-200/80 dark:border-white/[0.1] rounded-[26px] p-5 sm:p-6 shadow-luxury transition-all duration-200 backdrop-blur-xs">
      {/* Decorative Brand Top Accent with Foil Sheen */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${brandColor} 0%, color-mix(in srgb, ${brandColor} 70%, white) 50%, ${brandColor} 100%)`,
        }}
      />

      {/* Card Header: Title on Left, Dynamic Upcoming Reward Badge on Right */}
      <div className="flex items-center justify-between gap-3 mb-4 pt-1">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
            Digital Loyalty Pass
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
            {restaurantName}
          </h3>
        </div>
        <div className="flex items-center">
          <div
            className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold font-mono shrink-0 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.1]"
            style={{
              backgroundColor: badgeBg,
              color: brandColor,
            }}
          >
            {totalLifetimeStamps} / {targetRewardStamp} Stamps
          </div>
        </div>
      </div>

      {/* Next Reward Callout Banner */}
      {nextMilestone && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-950/30 border border-amber-300/40 dark:border-amber-700/40 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
              {displayStampsNeeded === 0
                ? "Milestone Reached!"
                : `${displayStampsNeeded} more ${displayStampsNeeded === 1 ? "stamp" : "stamps"} to unlock:`}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
              {nextMilestone.rewardTitle}
            </span>
            {nextMilestone.rewardDescription && (
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block leading-tight mt-0.5 font-medium">
                {nextMilestone.rewardDescription}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stamp Slots Grid (Continuous numbering matching venue card capacity) */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5 my-2">
        {Array.from({ length: cardCapacity }).map((_, idx) => {
          const slotNum = baseOffset + idx + 1;
          const isFilled = slotNum <= totalLifetimeStamps;
          const isMilestone = milestoneRequirementsInCycle.includes(slotNum);

          return (
            <StampSlot
              key={slotNum}
              index={idx}
              visitNumber={slotNum}
              isFilled={isFilled}
              isMilestone={isMilestone}
              brandColor={brandColor}
            />
          );
        })}
      </div>

      {/* Card Subtext Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>Scan checkout QR after dining to collect stamps</span>
        </div>
      </div>
    </div>
  );
}
