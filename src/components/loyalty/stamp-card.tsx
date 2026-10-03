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
  // Set calculation: each card contains exactly 10 stamps
  // When 10 stamps are reached, it automatically advances to Set 2 (visits 11-20), Set 3 (21-30), etc.
  const activeSetIndex = Math.floor(totalLifetimeStamps / 10) + 1;
  const [selectedSet, setSelectedSet] = React.useState<number>(activeSetIndex);

  React.useEffect(() => {
    setSelectedSet(Math.floor(totalLifetimeStamps / 10) + 1);
  }, [totalLifetimeStamps]);

  const totalSets = Math.max(1, activeSetIndex);
  const baseOffset = (selectedSet - 1) * 10;
  const earnedInThisSet = Math.max(0, Math.min(10, totalLifetimeStamps - baseOffset));
  const progressPercent = Math.min(100, Math.round((earnedInThisSet / 10) * 100));

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
            {earnedInThisSet} / 10 Stamps
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            {totalLifetimeStamps} Total Lifetime Stamps
          </span>
        </div>
      </div>

      {/* Set Switcher (Visible when diner has progressed past Set 1) */}
      {totalSets > 1 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 pt-0.5">
          {Array.from({ length: totalSets }).map((_, sIdx) => {
            const setNum = sIdx + 1;
            const isSelected = selectedSet === setNum;
            const isCompleted = setNum < activeSetIndex;
            const stampsInThatSet = Math.max(0, Math.min(10, totalLifetimeStamps - (setNum - 1) * 10));

            return (
              <button
                key={setNum}
                type="button"
                onClick={() => setSelectedSet(setNum)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Set {setNum}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isCompleted ? "Completed" : `${stampsInThatSet}/10`}
                </span>
              </button>
            );
          })}
        </div>
      )}

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

      {/* Set Notification when viewing an active continuation card */}
      {selectedSet > 1 && selectedSet === activeSetIndex && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-teal-50 border border-teal-200/70 text-teal-800 text-[11px] font-semibold flex items-center justify-between">
          <span>Set {selectedSet} Active (Visits {baseOffset + 1} to {baseOffset + 10})</span>
          <span className="text-[10px] text-teal-600 font-bold uppercase">Continuing Cycle</span>
        </div>
      )}

      {/* Stamp Slots Grid (Fixed 10 slots: 5 columns x 2 rows) */}
      <div className="grid grid-cols-5 gap-2 my-4">
        {Array.from({ length: 10 }).map((_, idx) => {
          const visitNum = baseOffset + idx + 1;
          const isFilled = visitNum <= totalLifetimeStamps;
          const isMilestone =
            nextMilestone && nextMilestone.stampRequirement === visitNum
              ? true
              : idx === 9;

          return (
            <StampSlot
              key={visitNum}
              index={idx}
              visitNumber={visitNum}
              isFilled={isFilled}
              isMilestone={isMilestone}
              brandColor={brandColor}
            />
          );
        })}
      </div>

      {/* Progress Bar for Current Set */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
          <span>Set {selectedSet} Progress</span>
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
