"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { trackEvent } from "@/lib/analytics/tracker";
import { GuestActionData } from "@/types";

interface GuestActionCardProps {
  action: GuestActionData;
  restaurantId: string;
  brandPrimaryColor?: string;
  onActionClick?: (action: GuestActionData) => void;
}

export function GuestActionCard({
  action,
  restaurantId,
  brandPrimaryColor = "var(--brand-primary, #0F766E)",
  onActionClick,
}: GuestActionCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleClick = () => {
    // Determine event name based on action type
    const eventTypeMap: Record<string, string> = {
      MENU: "menu_click",
      REWARDS: "loyalty_open",
      REVIEW: "review_click",
      WIFI: "wifi_open",
      FEEDBACK: "feedback_open",
      GAME: "game_open",
      SOCIAL: "social_click",
    };

    const eventName = eventTypeMap[action.type] || "action_click";
    trackEvent({
      restaurantId,
      eventType: eventName,
      actionId: action.id,
    });

    if (onActionClick) {
      onActionClick(action);
    }
  };

  const isExternal = action.url?.startsWith("http");

  const isHex = brandPrimaryColor.startsWith("#");
  const bgTint = isHex ? `${brandPrimaryColor}14` : "color-mix(in srgb, var(--brand-primary) 12%, transparent)";
  const badgeTint = isHex ? `${brandPrimaryColor}18` : "color-mix(in srgb, var(--brand-primary) 16%, transparent)";

  const CardInner = (
    <motion.div
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
      className="group relative flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#0E1520] hover:bg-white dark:hover:bg-[#121B29] border border-slate-200/70 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-[20px] shadow-panel hover:shadow-panel-hover transition-[box-shadow,border-color,background-color] duration-300 cursor-pointer select-none overflow-hidden"
    >
      {/* Light sweep on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100 dark:via-white/[0.06]"
      />

      {/* Icon & Details */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
        {/* Dynamic Icon Container */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.36,0.64,1)] group-hover:scale-110 group-hover:-rotate-6 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
          style={{
            backgroundColor: bgTint,
            color: brandPrimaryColor,
          }}
        >
          <IconRenderer name={action.icon} className="w-5 h-5" />
        </div>

        {/* Text */}
        <div className="min-w-0">
          {action.badge && (
            <span
              className="mb-1 inline-flex items-center rounded-md px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.08em]"
              style={{
                backgroundColor: badgeTint,
                color: brandPrimaryColor,
              }}
            >
              {action.badge}
            </span>
          )}
          <h3 className="font-semibold text-[15px] text-slate-900 dark:text-white leading-snug line-clamp-2 tracking-tight">
            {action.title}
          </h3>
          {action.description && (
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-1">
              {action.description}
            </p>
          )}
        </div>
      </div>

      {/* Right Indicator Chevron */}
      <div className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-slate-800/80 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0 transition-all duration-200 border border-slate-200/50 dark:border-white/[0.06]">
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.div>
  );

  if (action.url) {
    if (isExternal) {
      return (
        <a href={action.url} target="_blank" rel="noopener noreferrer" className="block rounded-[20px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#0F766E)] focus-visible:ring-offset-2">
          {CardInner}
        </a>
      );
    }
    return (
      <Link href={action.url} className="block rounded-[20px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#0F766E)] focus-visible:ring-offset-2">
        {CardInner}
      </Link>
    );
  }

  return CardInner;
}
