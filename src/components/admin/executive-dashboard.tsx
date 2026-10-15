"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import {
  Users,
  Award,
  Star,
  MessageSquare,
  Gift,
  QrCode,
  Wifi,
  TrendingUp,
  ArrowRight,
  UtensilsCrossed,
  Share2,
  Tag,
  AlertCircle,
  Sparkles,
  Activity,
  Clock,
  Flame,
  Repeat2,
  Wallet,
  Trophy,
  Ticket,
  UserCheck,
  EyeOff,
  RotateCw,
} from "lucide-react";
import { Stagger, AnimatedNumber } from "@/components/ui/motion";
import { AreaChart, BarList, ColumnChart, Donut, Funnel, HeatGrid, Legend, RadialGauge, compact } from "@/components/charts";
import {
  DashboardSkeleton,
  KpiTile,
  PERIOD_LONG,
  Panel,
  PanelEmpty,
  PeriodToolbar,
  longDate,
  shortDate,
  type PeriodKey,
} from "@/components/admin/dashboard-kit";

/* ─── Types ─── */
interface DashboardGuest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  totalVisits: number;
  activeRewards: number;
  lastVisit: string;
  joinedAt: string;
}

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  kpis: {
    visits: { current: number; previous: number; change: number };
    stamps: { current: number; previous: number; change: number };
    feedbacks: { current: number; previous: number; change: number };
    newCustomers: { current: number; previous: number; change: number };
    returningPct: number;
  };
  timeSeries: { date: string; current: number; previous: number }[];
  actionBreakdown: { action: string; icon: string; count: number; percentage: number }[];
  loyalty: {
    activeWallets: number;
    stampsIssued: number;
    milestonesUnlocked: number;
    rewardsRedeemed: number;
  };
  customerInsights: {
    totalGuests: number;
    newGuestsPct: number;
    returningPct: number;
    identifiedGuests: number;
    anonymousGuests: number;
  };
  feedbackDistribution: { stars: number; count: number; percentage: number }[];
  averageRating: number;
  positivePct: number;
  heatmap: number[][];
  funnel: { label: string; count: number; percentage: number }[];
  guests: DashboardGuest[];
}

interface ExecutiveDashboardProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
  };
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  QrCode, UtensilsCrossed, Star, Wifi, Award, MessageSquare, Share2, Gift, Sparkles, Activity, Clock, AlertCircle, Tag, TrendingUp,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || Activity;
  return <Icon className={className} />;
}

/* ─── Main Component ─── */
export function ExecutiveDashboard({ restaurant }: ExecutiveDashboardProps) {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);
    try {
      let url = `/api/restaurants/${restaurant.id}/dashboard?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        if (!isSilent) setError(json.error || "Unknown error");
      }
    } catch {
      if (!isSilent) setError("Unable to load dashboard data. Please try again.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [restaurant.id, period, customFrom, customTo]);

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchDashboard();
  }, [fetchDashboard, period, customFrom, customTo]);

  // Live refresh: 30s polling + realtime events, paused while hidden, never overlapping
  useLiveRefresh(restaurant.id, () => fetchDashboard(true));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Header + period controls */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2 py-0.5 text-teal-800 ring-1 ring-inset ring-teal-600/15 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20">
              <Sparkles className="h-3 w-3" />
              Overview
            </span>
            <span>{PERIOD_LONG[period]}</span>
            {data && (
              <span className="hidden sm:inline text-slate-400">
                · {shortDate(data.startDate.slice(0, 10))} – {shortDate(data.endDate.slice(0, 10))}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[30px] dark:text-white">
            {greeting}, <span className="text-teal-700 dark:text-teal-300">{restaurant.name}</span>
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
            {loading && !data ? "Pulling the latest numbers from your venue…" : "Here's how your guest experience is performing."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodToolbar
            layoutId="dashboard-period"
            period={period}
            onPeriod={setPeriod}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFrom={setCustomFrom}
            onCustomTo={setCustomTo}
            loading={loading}
          />
        </div>
      </motion.header>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => fetchDashboard()}
              className="pressable ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-800"
            >
              <RotateCw className="h-3 w-3" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && !data && <DashboardSkeleton />}

      {data && (
        <Stagger className="space-y-4 sm:space-y-5" stagger={0.05}>
          {/* 2. KPI tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              featured
              label="Guest engagements"
              value={data.kpis.visits.current}
              format={compact}
              delta={data.kpis.visits.change}
              icon={<Users className="h-4 w-4" />}
              spark={data.timeSeries.map((d) => d.current)}
            />
            <KpiTile
              label="Loyalty stamps issued"
              value={data.kpis.stamps.current}
              format={compact}
              delta={data.kpis.stamps.change}
              icon={<Award className="h-4 w-4" />}
            />
            <KpiTile
              label="Guest feedback"
              value={data.kpis.feedbacks.current}
              format={compact}
              delta={data.kpis.feedbacks.change}
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <KpiTile
              label="Returning guests"
              value={data.kpis.returningPct}
              format={(n) => `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`}
              icon={<Repeat2 className="h-4 w-4" />}
              hint={`${data.kpis.newCustomers.current.toLocaleString()} new wallets this period`}
            />
          </div>

          {/* 3. Engagement chart + Guest actions */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
            <EngagementPanel timeSeries={data.timeSeries} />
            <GuestActionsPanel actions={data.actionBreakdown} />
          </div>

          {/* 4. Loyalty, Customer Insights, Feedback */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <LoyaltyPanel loyalty={data.loyalty} restaurantId={restaurant.id} timeSeries={data.timeSeries} />
            <CustomerInsightsPanel insights={data.customerInsights} restaurantId={restaurant.id} />
            <FeedbackPanel
              distribution={data.feedbackDistribution}
              averageRating={data.averageRating}
              positivePct={data.positivePct}
              restaurantId={restaurant.id}
            />
          </div>

          {/* 5. Heatmap + Funnel */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-5">
            <PeakActivityPanel heatmap={data.heatmap} />
            <ReviewJourneyPanel funnel={data.funnel} />
          </div>
        </Stagger>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANELS
   ═══════════════════════════════════════════════════════════════ */

function ViewLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group/link inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-400/10"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
    </Link>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-inset ring-slate-200/60 dark:bg-white/[0.03] dark:ring-white/[0.06]">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <AnimatedNumber value={value} className="mt-1 block text-lg font-semibold tracking-tight text-slate-900 dark:text-white" />
    </div>
  );
}

/* ─── Engagement over time ─── */
function EngagementPanel({ timeSeries }: { timeSeries: DashboardData["timeSeries"] }) {
  const current = timeSeries.map((d) => d.current);
  const previous = timeSeries.map((d) => d.previous);
  const total = current.reduce((a, b) => a + b, 0);
  const prevTotal = previous.reduce((a, b) => a + b, 0);
  const avg = timeSeries.length ? total / timeSeries.length : 0;
  const peakIdx = current.length ? current.indexOf(Math.max(...current)) : -1;

  return (
    <Panel
      className="xl:col-span-2"
      title="Guest engagement"
      description="Every interaction on your guest hub, compared with the previous period."
      action={
        <Legend
          items={[
            { label: "This period", color: "var(--chart-1)" },
            { label: "Previous", color: "var(--chart-axis)", dashed: true },
          ]}
        />
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-3 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
        <div>
          <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">All interactions</div>
          <AnimatedNumber value={total} className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white" />
          <span className="ml-1.5 text-[11.5px] text-slate-400 tabular">vs {prevTotal.toLocaleString()}</span>
        </div>
        <div>
          <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">Daily average</div>
          <AnimatedNumber value={avg} format={(n) => n.toFixed(1)} className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white" />
        </div>
        <div>
          <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">Busiest day</div>
          <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {peakIdx >= 0 && current[peakIdx] > 0 ? shortDate(timeSeries[peakIdx].date) : "—"}
          </div>
        </div>
      </div>
      {total === 0 && prevTotal === 0 ? (
        <PanelEmpty
          icon={<Activity className="h-4 w-4" />}
          title="No guest activity yet"
          hint="Share your table QR codes — engagement will chart here in real time."
        />
      ) : (
        <AreaChart
          ariaLabel="Guest engagement over time, current versus previous period"
          labels={timeSeries.map((d) => d.date)}
          formatLabel={shortDate}
          formatTooltipLabel={longDate}
          height={250}
          series={[
            { key: "previous", label: "Previous", color: "var(--chart-axis)", data: previous, dashed: true },
            { key: "current", label: "This period", color: "var(--chart-1)", data: current },
          ]}
        />
      )}
    </Panel>
  );
}

/* ─── Guest actions ─── */
function GuestActionsPanel({ actions }: { actions: DashboardData["actionBreakdown"] }) {
  const total = actions.reduce((a, b) => a + b.count, 0);
  return (
    <Panel title="Guest actions" description="Which touchpoints guests use most.">
      {total === 0 ? (
        <PanelEmpty icon={<Sparkles className="h-4 w-4" />} title="No actions recorded" hint="Menu views, Wi-Fi, reviews and loyalty taps will appear here." />
      ) : (
        <BarList
          items={actions.map((a) => ({
            key: a.action,
            label: a.action,
            value: a.count,
            icon: (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-teal-700 ring-1 ring-slate-200/80 dark:bg-white/[0.05] dark:text-teal-300 dark:ring-white/[0.08]">
                <DynamicIcon name={a.icon} className="h-3.5 w-3.5" />
              </span>
            ),
            meta: <span className="text-[11px] font-medium tabular text-slate-400">{a.percentage}%</span>,
          }))}
        />
      )}
    </Panel>
  );
}

/* ─── Loyalty performance ─── */
function LoyaltyPanel({
  loyalty,
  restaurantId,
  timeSeries,
}: {
  loyalty: DashboardData["loyalty"];
  restaurantId: string;
  timeSeries: DashboardData["timeSeries"];
}) {
  const recent = timeSeries.slice(-20);
  return (
    <Panel
      title="Loyalty performance"
      description="Wallets, stamps and rewards at a glance."
      action={<ViewLink href={`/admin/restaurants/${restaurantId}/loyalty`}>Details</ViewLink>}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Active wallets" value={loyalty.activeWallets} icon={<Wallet className="h-3.5 w-3.5" />} />
        <Stat label="Stamps issued" value={loyalty.stampsIssued} icon={<Award className="h-3.5 w-3.5" />} />
        <Stat label="Milestones" value={loyalty.milestonesUnlocked} icon={<Trophy className="h-3.5 w-3.5" />} />
        <Stat label="Redeemed" value={loyalty.rewardsRedeemed} icon={<Ticket className="h-3.5 w-3.5" />} />
      </div>
      <div className="mt-4">
        <div className="mb-2 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">Daily guest activity</div>
        <ColumnChart
          ariaLabel="Daily guest activity for the most recent days"
          data={recent.map((d) => d.current)}
          labels={recent.map((d) => d.date)}
          formatLabel={shortDate}
          height={96}
          tickEvery={Math.max(1, Math.ceil(recent.length / 3))}
          valueFormatter={(n) => `${n.toLocaleString()} interactions`}
        />
      </div>
    </Panel>
  );
}

/* ─── Customer insights ─── */
function CustomerInsightsPanel({
  insights,
  restaurantId,
}: {
  insights: DashboardData["customerInsights"];
  restaurantId: string;
}) {
  const retPct = insights.returningPct || 0;
  const newPct = insights.newGuestsPct || 0;
  const returning = Math.round((insights.totalGuests * retPct) / 100);
  const fresh = Math.max(0, insights.totalGuests - returning);
  const identifiedPct = insights.totalGuests > 0 ? Math.round((insights.identifiedGuests / insights.totalGuests) * 100) : 0;

  return (
    <Panel
      title="Customer insights"
      description="Who your guests are."
      action={<ViewLink href={`/admin/restaurants/${restaurantId}/customers`}>CRM</ViewLink>}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <Donut
          size={150}
          thickness={14}
          centerLabel="Total guests"
          centerValue={insights.totalGuests.toLocaleString()}
          segments={[
            { key: "new", label: "New", value: fresh, color: "var(--chart-1)" },
            { key: "returning", label: "Returning", value: returning, color: "var(--chart-3)" },
          ]}
        />
        <div className="w-full flex-1 space-y-2.5 text-[12.5px]">
          <LegendRow color="var(--chart-1)" label="New guests" value={fresh} pct={newPct} />
          <LegendRow color="var(--chart-3)" label="Returning" value={returning} pct={retPct} />
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Identified {insights.identifiedGuests.toLocaleString()}</span>
          <span className="flex items-center gap-1.5">Anonymous {insights.anonymousGuests.toLocaleString()} <EyeOff className="h-3.5 w-3.5" /></span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.05]">
          <motion.div
            className="h-full rounded-full bg-teal-600 dark:bg-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${identifiedPct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </div>
        <p className="mt-1.5 text-[11.5px] text-slate-400">{identifiedPct}% of wallets are linked to a guest profile</p>
      </div>
    </Panel>
  );
}

function LegendRow({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2.5 py-2 ring-1 ring-inset ring-slate-200/60 dark:ring-white/[0.06]">
      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
        <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: color }} />
        {label}
      </span>
      <span className="tabular">
        <span className="font-semibold text-slate-900 dark:text-white">{value.toLocaleString()}</span>
        <span className="ml-1.5 text-[11px] text-slate-400">{pct}%</span>
      </span>
    </div>
  );
}

/* ─── Feedback overview ─── */
function FeedbackPanel({
  distribution,
  averageRating,
  positivePct,
  restaurantId,
}: {
  distribution: DashboardData["feedbackDistribution"];
  averageRating: number;
  positivePct: number;
  restaurantId: string;
}) {
  return (
    <Panel
      className="lg:col-span-2 xl:col-span-1"
      title="Feedback overview"
      description="What guests are saying."
      action={<ViewLink href={`/admin/restaurants/${restaurantId}/feedback`}>Inbox</ViewLink>}
    >
      <div className="flex items-center gap-5">
        <RadialGauge value={averageRating} max={5} size={132} thickness={12} color="var(--chart-3)">
          <div className="text-2xl font-semibold leading-none tracking-tight text-slate-900 dark:text-white tabular">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </div>
          <div className="mt-1 flex items-center gap-0.5 text-amber-500">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-3 w-3 ${i <= Math.round(averageRating) ? "fill-current" : "opacity-30"}`} />
            ))}
          </div>
        </RadialGauge>
        <div className="flex-1">
          <div className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">Positive (4–5★)</div>
          <AnimatedNumber value={positivePct} format={(n) => `${Math.round(n)}%`} className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {distribution.map((item, i) => (
          <div key={item.stars} className="flex items-center gap-3 text-[12px]">
            <span className="flex w-8 shrink-0 items-center gap-0.5 font-medium text-slate-600 dark:text-slate-300">
              {item.stars}
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: item.stars >= 4 ? "var(--chart-1)" : item.stars === 3 ? "var(--chart-3)" : "var(--chart-5)" }}
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.06 }}
              />
            </div>
            <span className="w-14 shrink-0 text-right tabular text-slate-400">
              {item.count} · {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ─── Peak activity heatmap ─── */
function PeakActivityPanel({ heatmap }: { heatmap: number[][] }) {
  const timeSlots = ["Morning", "Afternoon", "Evening", "Night"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const levelNames = ["No activity", "Light", "Busy", "Peak"];
  let best: [number, number] | null = null;
  heatmap.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v > 0 && (!best || v > heatmap[best[0]][best[1]])) best = [r, c];
    })
  );
  const peak = best as [number, number] | null;

  return (
    <Panel
      className="xl:col-span-3"
      icon={<Flame className="h-4 w-4" />}
      title="Peak guest activity"
      description="When guests engage most, by day and time of day (UTC)."
      action={
        peak ? (
          <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11.5px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            Busiest: {days[peak[1]]} {timeSlots[peak[0]].toLowerCase()}
          </span>
        ) : null
      }
    >
      <HeatGrid
        matrix={heatmap}
        rowLabels={timeSlots}
        colLabels={days}
        describe={(r, c, v) => `${days[c]} ${timeSlots[r].toLowerCase()} — ${levelNames[v] ?? "Activity"}`}
      />
    </Panel>
  );
}

/* ─── Review journey funnel ─── */
function ReviewJourneyPanel({ funnel }: { funnel: DashboardData["funnel"] }) {
  const first = funnel[0]?.count ?? 0;
  const last = funnel[funnel.length - 1]?.count ?? 0;
  const overall = first > 0 ? Math.round((last / first) * 1000) / 10 : 0;
  return (
    <Panel
      className="xl:col-span-2"
      title="Review journey"
      description="From first interaction to feedback."
      action={
        <span className="text-right">
          <span className="block text-[11px] font-medium text-slate-400">Overall</span>
          <span className="text-sm font-semibold tabular text-slate-900 dark:text-white">{overall}%</span>
        </span>
      }
    >
      <Funnel stages={funnel.map((f) => ({ label: f.label, count: f.count }))} />
    </Panel>
  );
}
