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
      card: "glass spotlight",
      iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-white/[0.08]",
      titleColor: "text-slate-500 dark:text-slate-400",
      valueColor: "text-slate-900 dark:text-slate-100",
    },
    turquoise: {
      card: "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/70 dark:border-teal-800/40 hover:border-teal-300 dark:hover:border-teal-700",
      iconBg: "bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-700/50",
      titleColor: "text-teal-800 dark:text-teal-300",
      valueColor: "text-teal-950 dark:text-teal-100",
    },
    indigo: {
      card: "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-800/40 hover:border-indigo-300 dark:hover:border-indigo-700",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-700/50",
      titleColor: "text-indigo-800 dark:text-indigo-300",
      valueColor: "text-indigo-950 dark:text-indigo-100",
    },
    amber: {
      card: "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/50",
      titleColor: "text-amber-800 dark:text-amber-300",
      valueColor: "text-amber-950 dark:text-amber-100",
    },
    orange: {
      card: "bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-800/40 hover:border-orange-300 dark:hover:border-orange-700",
      iconBg: "bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-700/50",
      titleColor: "text-orange-800 dark:text-orange-300",
      valueColor: "text-orange-950 dark:text-orange-100",
    },
    purple: {
      card: "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700",
      iconBg: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-700/50",
      titleColor: "text-purple-800 dark:text-purple-300",
      valueColor: "text-purple-950 dark:text-purple-100",
    },
  };

  const currentAccent = accentStyles[accentColor];

  return (
    <div
      className={cn(
        "group p-5 rounded-[22px] border glass-hover transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-panel-hover flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-500",
        currentAccent.card,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={cn("text-[12.5px] font-medium", currentAccent.titleColor)}>
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
              currentAccent.iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className={cn("text-2xl sm:text-[28px] font-semibold tracking-tight tabular", currentAccent.valueColor)}>
          {value}
        </div>

        {(trend || description) && (
          <div className="flex items-center gap-2 pt-0.5 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-bold inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px]",
                  trend.isPositive
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50"
                    : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50"
                )}
              >
                {trend.value}
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 truncate font-medium">
              {trend?.label || description}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
