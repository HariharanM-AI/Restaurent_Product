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
  // A fresh card contains exactly 10 stamps (slots 1 to 10).
  // When 10 finishes, it resets to a fresh next 10 loyalty stamps.
  const currentCardStamps = totalLifetimeStamps % 10;

  // The target stamps counter acts dynamically according to the upcoming reward preferred by the client
  // (e.g. 5 stamps for Milestone 1, 10 stamps for Milestone 2, or custom client requirement)
  const targetStamps = nextMilestone
    ? ((nextMilestone.stampRequirement - 1) % 10) + 1
    : 10;

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
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Digital Stamp Card
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {restaurantName}
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <div
            className="px-3 py-1 rounded-full text-xs font-bold font-mono shrink-0 shadow-xs"
            style={{
              backgroundColor: badgeBg,
              color: brandColor,
            }}
          >
            {currentCardStamps} / {targetStamps} Stamps
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            {totalLifetimeStamps} Total Lifetime Stamps
          </span>
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
              {stampsNeeded === 0
                ? "Milestone Reached!"
                : `${stampsNeeded} more ${stampsNeeded === 1 ? "stamp" : "stamps"} to unlock:`}
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

      {/* Stamp Slots Grid (Always 10 fresh slots: 5 columns x 2 rows, numbered 1 to 10) */}
      <div className="grid grid-cols-5 gap-2 my-2">
        {Array.from({ length: 10 }).map((_, idx) => {
          const slotNum = idx + 1;
          const isFilled = slotNum <= currentCardStamps;

          // Check if this slot corresponds to a client-configured milestone reward
          const isMilestone =
            milestones.length > 0
              ? milestones.some((m) => ((m.stampRequirement - 1) % 10) + 1 === slotNum)
              : nextMilestone && targetStamps === slotNum
              ? true
              : slotNum === 5 || slotNum === 10;

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
