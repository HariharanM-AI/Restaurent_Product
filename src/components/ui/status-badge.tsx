import React from "react";
import { cn } from "@/lib/utils";

export type BadgeStatus =
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "brand"
  | "indigo"
  | "purple"
  | "active"
  | "inactive"
  | "info";

export interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status = "neutral",
  label,
  size = "sm",
  showDot = true,
  className,
}: StatusBadgeProps) {
  // Normalize alias statuses
  const normalizedStatus =
    status === "active"
      ? "success"
      : status === "inactive"
      ? "neutral"
      : status === "info"
      ? "brand"
      : status;

  const styles: Record<string, string> = {
    success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
    warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
    error: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60",
    neutral: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    brand: "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60",
    indigo: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60",
    purple: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
  };

  const dotColors: Record<string, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    neutral: "bg-slate-400",
    brand: "bg-teal-600",
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border shrink-0",
        styles[normalizedStatus] || styles.neutral,
        sizes[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[normalizedStatus] || dotColors.neutral)}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
