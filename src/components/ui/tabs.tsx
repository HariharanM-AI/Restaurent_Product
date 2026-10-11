"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({
  items,
  activeId,
  onChange,
  variant = "pill",
  className,
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={cn("flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar", className)}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "pb-3 text-xs sm:text-sm font-medium transition-all relative shrink-0 flex items-center gap-2",
                isActive
                  ? "text-slate-900 dark:text-white border-b-2 border-primary font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 bg-slate-100/80 dark:bg-slate-850/80 rounded-[14px] border border-slate-200/70 dark:border-white/[0.08] backdrop-blur-xs shadow-xs overflow-x-auto no-scrollbar",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-1.5 shrink-0 select-none",
              isActive
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-card font-bold border border-black/[0.04] dark:border-white/[0.08]"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/50"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
