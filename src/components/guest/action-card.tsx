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
  brandPrimaryColor = "#0F766E",
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

  const CardInner = (
    <motion.div
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
      className="group relative flex items-center justify-between p-4 bg-white hover:bg-slate-50/90 border border-slate-200/80 hover:border-slate-300 rounded-[20px] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-colors cursor-pointer select-none"
    >
      {/* Icon & Details */}
      <div className="flex items-center gap-3.5 min-w-0 pr-2">
        {/* Dynamic Icon Container */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${brandPrimaryColor}14`, // 8% opacity tint
            color: brandPrimaryColor,
          }}
        >
          <IconRenderer name={action.icon} className="w-5 h-5" />
        </div>

        {/* Text */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-slate-900 leading-snug truncate">
              {action.title}
            </h3>
            {action.badge && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full shrink-0"
                style={{
                  backgroundColor: `${brandPrimaryColor}18`,
                  color: brandPrimaryColor,
                }}
              >
                {action.badge}
              </span>
            )}
          </div>
          {action.description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-tight line-clamp-1">
              {action.description}
            </p>
          )}
        </div>
      </div>

      {/* Right Indicator Chevron */}
      <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 shrink-0 transition">
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </motion.div>
  );

  if (action.url) {
    if (isExternal) {
      return (
        <a href={action.url} target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
          {CardInner}
        </a>
      );
    }
    return (
      <Link href={action.url} className="block focus:outline-none">
        {CardInner}
      </Link>
    );
  }

  return CardInner;
}
