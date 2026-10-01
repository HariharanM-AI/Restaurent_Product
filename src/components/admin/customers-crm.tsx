"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { subscribeToActivity } from "@/lib/realtime/broadcast";
import {
  Users,
  Award,
  Gift,
  Calendar,
  Clock,
  ChevronRight,
  X,
  Phone,
  Mail,
  Smartphone,
  Star,
  CheckCircle2,
  Repeat,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";

export interface CrmCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  browserId: string;
  status: string;
  totalVisits: number;
  stampsBalance: number;
  lifetimeStamps: number;
  activeRewards: number;
  lastVisit: Date;
  joinedAt: Date;
  transactions: Array<{
    id: string;
    type: string;
    quantity: number;
    createdAt: Date;
  }>;
  rewards: Array<{
    id: string;
    title: string;
    status: string;
    unlockedAt: Date;
    redeemedAt?: Date | null;
  }>;
  feedbacks: Array<{
    id: string;
    rating: number;
    message: string;
    createdAt: Date;
  }>;
}

interface CustomersCrmProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
  initialCustomers: CrmCustomer[];
}

/* ─── Date filter periods ─── */
const DATE_PERIODS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "1y", label: "1 Year" },
  { key: "custom", label: "Custom" },
] as const;

/* ─── Helpers ─── */
function getStatusInfo(status: string): { label: string; statusType: "success" | "warning" | "neutral" } {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return { label: "Active", statusType: "success" };
    case "INACTIVE":
      return { label: "Inactive", statusType: "neutral" };
    case "SUSPENDED":
      return { label: "Suspended", statusType: "warning" };
    default:
      return { label: "Enrolled", statusType: "success" };
  }
}

function isWithinPeriod(date: Date, startDate: Date | null): boolean {
  if (!startDate) return true;
  return new Date(date) >= startDate;
}

export function CustomersCrm({ restaurant, initialCustomers }: CustomersCrmProps) {
  const [customers, setCustomers] = useState<CrmCustomer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [datePeriod, setDatePeriod] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer | null>(null);
  const [sortField, setSortField] = useState<"lastVisit" | "totalVisits" | "stampsBalance">("lastVisit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Keep state in sync with initialCustomers prop changes
  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  // Fetch updated CRM customers in real-time
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/customers`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomers(json.data);
          if (selectedCustomer) {
            const updated = json.data.find((c: CrmCustomer) => c.id === selectedCustomer.id);
            if (updated) setSelectedCustomer(updated);
          }
        }
      }
    } catch {}
  }, [restaurant.id, selectedCustomer]);

  // Subscribe to real-time events & poll periodically
  useEffect(() => {
    const unsubscribe = subscribeToActivity(restaurant.id, () => {
      fetchCustomers();
    });

    const pollInterval = setInterval(() => {
      fetchCustomers();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [restaurant.id, fetchCustomers]);

  // Compute date filter range
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePeriod) {
      case "today":
        return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now };
      case "7d":
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
      case "30d":
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
      case "90d":
        return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
      case "1y":
        return { start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), end: now };
      case "custom":
        return {
          start: customFrom ? new Date(customFrom) : null,
          end: customTo ? new Date(customTo) : now,
        };
      default:
        return { start: null, end: now };
    }
  }, [datePeriod, customFrom, customTo]);

  const filterTabs = useMemo(() => [
    { id: "all", label: "All Guests", count: customers.length },
    {
      id: "stamps",
      label: "With Stamps",
      count: customers.filter((c) => c.stampsBalance > 0).length,
    },
    {
      id: "rewards",
      label: "Unlocked Rewards",
      count: customers.filter((c) => c.activeRewards > 0).length,
    },
    {
      id: "returning",
      label: "Returning",
      count: customers.filter((c) => c.totalVisits > 1).length,
    },
  ], [customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Type filter tab
        if (activeFilter === "stamps" && c.stampsBalance === 0) return false;
        if (activeFilter === "rewards" && c.activeRewards === 0) return false;
        if (activeFilter === "returning" && c.totalVisits <= 1) return false;

        // Date filter — filter by last visit
        if (dateRange.start && !isWithinPeriod(c.lastVisit, dateRange.start)) return false;

        // Search query
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesEmail = c.email?.toLowerCase().includes(q) || false;
          const matchesPhone = c.phone?.toLowerCase().includes(q) || false;
          const matchesBrowser = c.browserId.toLowerCase().includes(q);
          return matchesName || matchesEmail || matchesPhone || matchesBrowser;
        }

        return true;
      })
      .sort((a, b) => {
        const aVal = sortField === "lastVisit" ? new Date(a.lastVisit).getTime() : a[sortField];
        const bVal = sortField === "lastVisit" ? new Date(b.lastVisit).getTime() : b[sortField];
        return sortDir === "desc" ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
      });
  }, [customers, activeFilter, searchQuery, dateRange, sortField, sortDir]);

  // KPI Computations
  const kpis = useMemo(() => {
    const guests = filteredCustomers;
    const totalGuests = guests.length;
    const returningGuests = guests.filter((c) => c.totalVisits > 1).length;
    const returningPct = totalGuests > 0 ? Math.round((returningGuests / totalGuests) * 100) : 0;
    const totalStamps = guests.reduce((sum, c) => sum + c.stampsBalance, 0);
    const avgStamps = totalGuests > 0 ? Math.round((totalStamps / totalGuests) * 10) / 10 : 0;
    const withRewards = guests.filter((c) => c.activeRewards > 0).length;
    const avgVisits = totalGuests > 0 ? Math.round((guests.reduce((s, c) => s + c.totalVisits, 0) / totalGuests) * 10) / 10 : 0;
    return { totalGuests, returningGuests, returningPct, totalStamps, avgStamps, withRewards, avgVisits };
  }, [filteredCustomers]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Visits", "Stamps", "Rewards", "Last Visit", "Joined"];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.email || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.status}"`,
      c.totalVisits,
      c.stampsBalance,
      c.activeRewards,
      `"${new Date(c.lastVisit).toLocaleDateString()}"`,
      `"${new Date(c.joinedAt).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `noura-customers-${restaurant.slug}-${datePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Track loyalty wallet holders, repeat visit retention, and individual stamp progression."
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4 text-slate-500" />}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
        }
      />

      {/* Date Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {DATE_PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setDatePeriod(p.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              datePeriod === p.key
                ? "bg-[#0B3B36] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {p.key === "custom" && <Calendar className="w-3 h-3 inline mr-1.5 -mt-px" />}
            {p.label}
          </button>
        ))}

        {datePeriod === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
          label="Total Guests"
          value={kpis.totalGuests}
          sub={`${kpis.returningGuests} returning`}
        />
        <KPICard
          icon={<Repeat className="w-5 h-5" />}
          iconBg="bg-teal-50 text-teal-600"
          label="Retention Rate"
          value={`${kpis.returningPct}%`}
          sub={`${kpis.avgVisits} avg visits`}
        />
        <KPICard
          icon={<Award className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
          label="Total Stamps"
          value={kpis.totalStamps}
          sub={`${kpis.avgStamps} avg per guest`}
        />
        <KPICard
          icon={<Gift className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-600"
          label="With Rewards"
          value={kpis.withRewards}
          sub="active reward holders"
        />
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          placeholder="Search by name, email, or guest ID..."
        />

        <Tabs
          items={filterTabs}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Customer CRM Data Table */}
      <div className="overflow-x-auto rounded-[20px] border border-slate-200/80 bg-white shadow-card">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-5">Guest Profile</th>
              <th
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-800 transition select-none"
                onClick={() => handleSort("totalVisits")}
              >
                <span className="inline-flex items-center gap-1">
                  Visits
                  {sortField === "totalVisits" && (
                    <span className="text-emerald-600">{sortDir === "desc" ? "↓" : "↑"}</span>
                  )}
                </span>
              </th>
              <th
                className="py-3 px-4 text-center cursor-pointer hover:text-slate-800 transition select-none"
                onClick={() => handleSort("stampsBalance")}
              >
                <span className="inline-flex items-center gap-1">
                  Stamps
                  {sortField === "stampsBalance" && (
                    <span className="text-emerald-600">{sortDir === "desc" ? "↓" : "↑"}</span>
                  )}
                </span>
              </th>
              <th className="py-3 px-4 text-center">Rewards</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition select-none"
                onClick={() => handleSort("lastVisit")}
              >
                <span className="inline-flex items-center gap-1">
                  Last Visit
                  {sortField === "lastVisit" && (
                    <span className="text-emerald-600">{sortDir === "desc" ? "↓" : "↑"}</span>
                  )}
                </span>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <EmptyState
                    icon={<Users className="w-6 h-6 text-slate-400" />}
                    title="No guests found"
                    description={
                      searchQuery || datePeriod !== "all"
                        ? "Try adjusting your search criteria, filters, or date range."
                        : "Guests will automatically appear here as they scan checkout tokens or connect to Wi-Fi."
                    }
                  />
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => {
                const initials = cust.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const statusInfo = getStatusInfo(cust.status);
                const isReturning = cust.totalVisits > 1;

                return (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50/70 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          {isReturning && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center" title="Returning guest">
                              <Repeat className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate group-hover:text-teal-900 transition-colors">
                            {cust.name}
                          </span>
                          <span className="text-xs text-slate-400 block truncate">
                            {cust.email || cust.phone || `Wallet #${cust.browserId.slice(0, 8)}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold ${isReturning ? "text-emerald-700" : "text-slate-700"}`}>
                        {cust.totalVisits}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 text-xs">
                        <Award className="w-3 h-3 text-teal-600" />
                        <span>{cust.stampsBalance}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {cust.activeRewards > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 text-xs">
                          <Gift className="w-3 h-3 text-amber-600" />
                          <span>{cust.activeRewards} available</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                      <div>
                        <span className="block">
                          {new Date(cust.lastVisit).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(cust.lastVisit).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge
                        status={statusInfo.statusType}
                        label={statusInfo.label}
                        size="sm"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:text-teal-900">
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table Footer */}
        {filteredCustomers.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {filteredCustomers.length} of {initialCustomers.length} guests
              {datePeriod !== "all" || searchQuery || activeFilter !== "all" ? " (filtered)" : ""}
            </span>
            <span>
              {kpis.returningGuests} returning · {kpis.totalStamps} stamps active
            </span>
          </div>
        )}
      </div>

      {/* Slide-Over Customer Profile Drawer */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end transition-all"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedCustomer(null); }}
        >
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                    {selectedCustomer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  {selectedCustomer.totalVisits > 1 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white">
                      <Repeat className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge
                      status={getStatusInfo(selectedCustomer.status).statusType}
                      label={getStatusInfo(selectedCustomer.status).label + " Wallet"}
                      size="sm"
                    />
                    <span className="text-xs text-slate-400">
                      Joined {new Date(selectedCustomer.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                aria-label="Close profile drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Visits
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
                    {selectedCustomer.totalVisits}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-center">
                  <span className="text-[11px] font-semibold text-teal-700 block uppercase">
                    Stamps
                  </span>
                  <span className="text-xl font-extrabold text-teal-900 block mt-0.5">
                    {selectedCustomer.stampsBalance}
                  </span>
                  <span className="text-[10px] text-teal-600">
                    {selectedCustomer.lifetimeStamps} lifetime
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-center">
                  <span className="text-[11px] font-semibold text-amber-700 block uppercase">
                    Perks
                  </span>
                  <span className="text-xl font-extrabold text-amber-900 block mt-0.5">
                    {selectedCustomer.activeRewards}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Contact & Hardware Identifier
                </span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedCustomer.email || "No email on record"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedCustomer.phone || "No phone on record"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">
                      UUID: {selectedCustomer.browserId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visit timeline summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">Visit Timeline</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-600 font-semibold block">First Visit</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(selectedCustomer.joinedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-600 font-semibold block">Last Visit</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(selectedCustomer.lastVisit).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              {selectedCustomer.feedbacks.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Feedback ({selectedCustomer.feedbacks.length})
                  </span>
                  {selectedCustomer.feedbacks.map((f) => (
                    <div key={f.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < f.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-2">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3">{f.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rewards Unlocked */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Reward Milestones ({selectedCustomer.rewards.length})
                </span>

                {selectedCustomer.rewards.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    No milestone rewards unlocked yet.
                  </p>
                ) : (
                  selectedCustomer.rewards.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="w-4 h-4 text-teal-600" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{r.title}</p>
                          <p className="text-[10px] text-slate-400">
                            Unlocked {new Date(r.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        status={r.status === "AVAILABLE" ? "success" : "neutral"}
                        label={r.status}
                        size="sm"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Stamp Transaction History Timeline */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Ledger History ({selectedCustomer.transactions.length})
                </span>

                {selectedCustomer.transactions.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    No transactions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {txn.type.replace(/_/g, " ")}
                          </span>
                          {txn.quantity > 1 && (
                            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full text-slate-600 font-bold">
                              ×{txn.quantity}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── KPI Card Sub-component ─── */
function KPICard({ icon, iconBg, label, value, sub }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string | number; sub: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-2.5`}>
        {icon}
      </div>
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{value}</div>
      <div className="text-[11px] text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
