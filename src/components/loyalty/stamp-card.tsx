"use client";

import React from "react";
import { Award, Sparkles, Clock } from "lucide-react";
import { StampSlot } from "./stamp-slot";
import { LoyaltyMilestoneData } from "@/types";

interface StampCardProps {
  currentStamps: number;
  totalLifetimeStamps: number;
  nextMilestone: LoyaltyMilestoneData | null;
  stampsNeeded: number;
  restaurantName: string;
  brandColor?: string;
}

export function StampCard({
  currentStamps,
  totalLifetimeStamps,
  nextMilestone,
  stampsNeeded,
  restaurantName,
  brandColor = "var(--brand-primary, #0F766E)",
}: StampCardProps) {
  // Target stamps for the active card cycle (default 5 if no milestone defined)
  const targetStamps = nextMilestone ? nextMilestone.stampRequirement : 5;
  // Slots to display on this card
  const totalSlots = Math.min(Math.max(targetStamps, 5), 10);
  // Stamps earned on this specific card
  const earnedOnCard = Math.min(totalLifetimeStamps, targetStamps);
  const progressPercent = Math.min(100, Math.round((earnedOnCard / targetStamps) * 100));

  const isHex = brandColor.startsWith("#");
  const badgeBg = isHex ? `${brandColor}18` : "color-mix(in srgb, var(--brand-primary) 15%, transparent)";

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
      {/* Decorative Brand Top Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: brandColor }}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Digital Stamp Card
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {restaurantName}
          </h3>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold font-mono shrink-0 shadow-sm"
          style={{
            backgroundColor: badgeBg,
            color: brandColor,
          }}
        >
          {earnedOnCard} / {targetStamps} Stamps
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

      {/* Stamp Slots Grid (5 columns) */}
      <div className="grid grid-cols-5 gap-2 my-4">
        {Array.from({ length: totalSlots }).map((_, idx) => (
          <StampSlot
            key={idx}
            index={idx}
            isFilled={idx < earnedOnCard}
            isMilestone={idx === totalSlots - 1}
            brandColor={brandColor}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
          <span>Card Progress</span>
          <span className="font-mono font-semibold text-slate-700">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: brandColor,
            }}
          />
        </div>
      </div>

      {/* Subtext info */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Scan checkout QR after dining to collect stamps</span>
        </div>
      </div>
    </div>
  );
}
