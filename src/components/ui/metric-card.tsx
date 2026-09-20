import React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: "neutral" | "turquoise" | "indigo" | "amber" | "orange" | "purple";
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  accentColor = "neutral",
  className,
}: MetricCardProps) {
  const accentStyles = {
    neutral: {
      card: "bg-white border-slate-200/80 hover:border-slate-300",
      iconBg: "bg-slate-100 text-slate-700 border-slate-200/60",
      titleColor: "text-slate-500",
      valueColor: "text-slate-900",
    },
    turquoise: {
      card: "bg-teal-50/40 border-teal-200/70 hover:border-teal-300",
      iconBg: "bg-teal-500/10 text-teal-700 border-teal-200/60",
      titleColor: "text-teal-800",
      valueColor: "text-teal-950",
    },
    indigo: {
      card: "bg-indigo-50/40 border-indigo-200/70 hover:border-indigo-300",
      iconBg: "bg-indigo-500/10 text-indigo-700 border-indigo-200/60",
      titleColor: "text-indigo-800",
      valueColor: "text-indigo-950",
    },
    amber: {
      card: "bg-amber-50/40 border-amber-200/70 hover:border-amber-300",
      iconBg: "bg-amber-500/10 text-amber-700 border-amber-200/60",
      titleColor: "text-amber-800",
      valueColor: "text-amber-950",
    },
    orange: {
      card: "bg-orange-50/40 border-orange-200/70 hover:border-orange-300",
      iconBg: "bg-orange-500/10 text-orange-700 border-orange-200/60",
      titleColor: "text-orange-800",
      valueColor: "text-orange-950",
    },
    purple: {
      card: "bg-purple-50/40 border-purple-200/70 hover:border-purple-300",
      iconBg: "bg-purple-500/10 text-purple-700 border-purple-200/60",
      titleColor: "text-purple-800",
      valueColor: "text-purple-950",
    },
  };

  const currentAccent = accentStyles[accentColor];

  return (
    <div
      className={cn(
        "p-5 rounded-[20px] border shadow-card transition-all duration-200 hover:shadow-card-hover flex flex-col justify-between",
        currentAccent.card,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={cn("text-xs font-semibold uppercase tracking-wider", currentAccent.titleColor)}>
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
              currentAccent.iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className={cn("text-2xl sm:text-3xl font-bold tracking-tight", currentAccent.valueColor)}>
          {value}
        </div>

        {(trend || description) && (
          <div className="flex items-center gap-2 pt-0.5 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-medium inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
                  trend.isPositive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {trend.value}
              </span>
            )}
            <span className="text-slate-500 truncate">
              {trend?.label || description}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
