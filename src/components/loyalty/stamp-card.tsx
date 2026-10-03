"use client";

import React from "react";
import { Award, Sparkles } from "lucide-react";
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
  // Continuous 10-stamp card numbering:
  // Card 1: 1 to 10
  // Card 2: 11 to 20
  // Card 3: 21 to 30, etc.
  const cycleIndex = Math.floor(totalLifetimeStamps / 10);
  const baseOffset = cycleIndex * 10;

  // Active milestone targets in the current 10-stamp card cycle
  const activeMilestones =
    milestones.length > 0
      ? milestones
      : [
          { stampRequirement: 5, rewardTitle: "Reward Milestone" },
          { stampRequirement: 10, rewardTitle: "Reward Milestone" },
        ];

  const milestoneRequirementsInCycle = activeMilestones
    .map((m) => {
      const reqInCard = ((m.stampRequirement - 1) % 10) + 1;
      return baseOffset + reqInCard;
    })
    .sort((a, b) => a - b);

  // Dynamic target stamp requirement for upcoming reward
  // For example: 12/15 when user needs 3 more to achieve reward, 16/20 when user needs 4 more
  const targetRewardStamp =
    nextMilestone?.stampRequirement ??
    milestoneRequirementsInCycle.find((req) => req > totalLifetimeStamps) ??
    (baseOffset + 10);

  const displayStampsNeeded =
    stampsNeeded > 0
      ? stampsNeeded
      : Math.max(0, targetRewardStamp - totalLifetimeStamps);

  const isHex = brandColor.startsWith("#");
  const badgeBg = isHex ? `${brandColor}18` : "color-mix(in srgb, var(--brand-primary) 15%, transparent)";

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
      {/* Decorative Brand Top Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: brandColor }}
      />

      {/* Card Header: Title on Left, Dynamic Upcoming Reward Badge on Right */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Digital Stamp Card
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {restaurantName}
          </h3>
        </div>
        <div className="flex items-center">
          <div
            className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold font-mono shrink-0 shadow-xs"
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
        <div className="mb-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              {displayStampsNeeded === 0
                ? "Milestone Reached!"
                : `${displayStampsNeeded} more ${displayStampsNeeded === 1 ? "stamp" : "stamps"} to unlock:`}
            </span>
            <span className="text-xs font-bold text-slate-900 block truncate">
              {nextMilestone.rewardTitle}
            </span>
            {nextMilestone.rewardDescription && (
              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                {nextMilestone.rewardDescription}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stamp Slots Grid (Continuous numbering: 1-10, 11-20, 21-30, etc.) */}
      <div className="grid grid-cols-5 gap-2 my-2">
        {Array.from({ length: 10 }).map((_, idx) => {
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
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Scan checkout QR after dining to collect stamps</span>
        </div>
      </div>
    </div>
  );
}
