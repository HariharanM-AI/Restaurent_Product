"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, CalendarRange, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber, LiveDot, Segmented, fadeUp } from "@/components/ui/motion";
import { Sparkline } from "@/components/charts";

/* ─── Period options shared by dashboard + analytics ─── */
export const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "1y", label: "1Y" },
  { key: "custom", label: "Custom" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["key"];

export const PERIOD_LONG: Record<PeriodKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last 12 months",
  custom: "Custom range",
};

/* ─── Panel: the base surface for every dashboard widget ─── */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  icon,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className={cn(
        "group/panel glass glass-hover spotlight relative flex flex-col rounded-[22px]",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/[0.08]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>}
              {description && <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1 px-5 pb-5 pt-4 sm:px-6", bodyClassName)}>{children}</div>
    </motion.section>
  );
}

/* ─── Delta badge: ▲ 12.4% / ▼ 3% / — ─── */
export function Delta({ value, suffix = "%", className }: { value: number; suffix?: string; className?: string }) {
  const flat = value === 0;
  const up = value > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular",
        flat && "bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400",
        up && "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
        !flat && !up && "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
        className
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {flat ? "0" : Math.abs(value)}
      {suffix}
    </span>
  );
}

/* ─── KPI tile with count-up value + sparkline ─── */
export function KpiTile({
  label,
  value,
  format,
  delta,
  deltaSuffix,
  icon,
  spark,
  color = "var(--chart-1)",
  hint,
  featured = false,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: number;
  deltaSuffix?: string;
  icon: React.ReactNode;
  spark?: number[];
  color?: string;
  hint?: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative overflow-hidden rounded-[22px] border p-5 glass-hover",
        featured
          ? "border-teal-300/25 bg-gradient-to-br from-[#0F4A43]/90 via-[#0B2E2A]/90 to-[#0A2421]/90 text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_48px_-24px_rgba(4,47,46,0.8)]"
          : "glass spotlight"
      )}
    >
      {featured && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl animate-aurora" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(45,212,191,0.18),transparent_60%)]" />
        </>
      )}
      <div className="relative flex items-center justify-between">
        <span className={cn("text-[12.5px] font-medium", featured ? "text-teal-100/80" : "text-slate-500 dark:text-slate-400")}>{label}</span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
            featured ? "bg-white/10 text-teal-200 ring-1 ring-white/15" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/[0.08]"
          )}
        >
          {icon}
        </span>
      </div>
      <div className="relative mt-3 flex items-end gap-2.5">
        <AnimatedNumber
          value={value}
          format={format}
          className={cn("text-[28px] font-semibold leading-none tracking-tight", featured ? "text-white" : "text-slate-900 dark:text-white")}
        />
        {delta !== undefined && <Delta value={delta} suffix={deltaSuffix} className={featured ? "bg-white/10 text-teal-100 ring-white/15" : undefined} />}
      </div>
      <div className={cn("relative mt-1.5 text-[11.5px]", featured ? "text-teal-100/60" : "text-slate-400 dark:text-slate-500")}>
        {hint ?? "vs. previous period"}
      </div>
      {spark && spark.length > 1 && (
        <div className="relative -mx-1 mt-3">
          <Sparkline data={spark} color={featured ? "#5EEAD4" : color} height={36} />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Header toolbar: period selector + custom range + live status ─── */
export function PeriodToolbar({
  period,
  onPeriod,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  loading,
  layoutId,
}: {
  period: PeriodKey;
  onPeriod: (p: PeriodKey) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (v: string) => void;
  onCustomTo: (v: string) => void;
  loading: boolean;
  layoutId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence initial={false}>
        {period === "custom" && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="glass flex items-center gap-1.5 rounded-xl px-2 py-1">
              <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
              <label className="sr-only" htmlFor={`${layoutId}-from`}>From date</label>
              <input
                id={`${layoutId}-from`}
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFrom(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 outline-none dark:text-slate-200 dark:[color-scheme:dark]"
              />
              <span className="text-xs text-slate-300 dark:text-slate-600">→</span>
              <label className="sr-only" htmlFor={`${layoutId}-to`}>To date</label>
              <input
                id={`${layoutId}-to`}
                type="date"
                value={customTo}
                onChange={(e) => onCustomTo(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 outline-none dark:text-slate-200 dark:[color-scheme:dark]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Segmented
        ariaLabel="Reporting period"
        layoutId={layoutId}
        options={PERIODS}
        value={period}
        onChange={onPeriod}
      />
      <LiveStatus syncing={loading} />
    </div>
  );
}

export function LiveStatus({ syncing }: { syncing: boolean }) {
  return (
    <span
      className="glass inline-flex h-[34px] w-[6.25rem] shrink-0 items-center justify-center gap-2 rounded-xl text-[11.5px] font-medium text-slate-600 dark:text-slate-300"
      aria-live="polite"
    >
      <LiveDot tone={syncing ? "amber" : "emerald"} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={syncing ? "sync" : "live"}
          initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
          transition={{ duration: 0.15 }}
          className={syncing ? "text-shimmer" : undefined}
        >
          {syncing ? "Syncing" : "Live"}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Skeleton layout shown on first load ─── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-[22px] p-5">
            <div className="flex justify-between">
              <div className="skeleton h-3.5 w-24" />
              <div className="skeleton h-8 w-8" />
            </div>
            <div className="skeleton mt-4 h-7 w-28" />
            <div className="skeleton mt-3 h-3 w-20" />
            <div className="skeleton mt-4 h-9 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="skeleton h-[360px] rounded-2xl xl:col-span-2" />
        <div className="skeleton h-[360px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}

/* ─── Empty hint inside a panel ─── */
export function PanelEmpty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-white/[0.08]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-white/[0.04]">{icon}</span>
      <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="max-w-[260px] text-[12px] text-slate-400">{hint}</p>}
    </div>
  );
}

export const shortDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
export const longDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
