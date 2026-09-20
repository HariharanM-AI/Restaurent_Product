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
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-800 border-amber-200/80",
    error: "bg-rose-50 text-rose-700 border-rose-200/80",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
    brand: "bg-teal-50 text-teal-800 border-teal-200/80",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80",
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
