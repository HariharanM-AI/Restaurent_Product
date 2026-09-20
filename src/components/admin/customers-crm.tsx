"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Download,
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
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SaaSCard } from "@/components/ui/saas-card";
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

export function CustomersCrm({ restaurant, initialCustomers }: CustomersCrmProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer | null>(null);

  const filterTabs = [
    { id: "all", label: "All Guests", count: initialCustomers.length },
    {
      id: "stamps",
      label: "With Stamps",
      count: initialCustomers.filter((c) => c.stampsBalance > 0).length,
    },
    {
      id: "rewards",
      label: "Unlocked Rewards",
      count: initialCustomers.filter((c) => c.activeRewards > 0).length,
    },
  ];

  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((c) => {
      // Filter tab
      if (activeFilter === "stamps" && c.stampsBalance === 0) return false;
      if (activeFilter === "rewards" && c.activeRewards === 0) return false;

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
    });
  }, [initialCustomers, activeFilter, searchQuery]);

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Visits", "Stamps", "Rewards", "Last Visit"];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.email || ""}"`,
      `"${c.phone || ""}"`,
      c.totalVisits,
      c.stampsBalance,
      c.activeRewards,
      `"${new Date(c.lastVisit).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `guestlink-customers-${restaurant.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Manage dining guest profiles, track repeat visit retention, and review individual stamp progression."
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
              <th className="py-3 px-4 text-center">Visits</th>
              <th className="py-3 px-4 text-center">Stamps</th>
              <th className="py-3 px-4 text-center">Rewards</th>
              <th className="py-3 px-4">Last Visit</th>
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
                      searchQuery
                        ? "Try adjusting your search criteria or clearing filters."
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

                return (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50/70 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
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

                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {cust.totalVisits}
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
                      {new Date(cust.lastVisit).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status="success" label="Enrolled" size="sm" />
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
      </div>

      {/* Slide-Over Customer Profile Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end transition-all">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                  {selectedCustomer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status="success" label="Active Loyalty Wallet" size="sm" />
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

                <div className="space-y-2">
                  {selectedCustomer.transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {txn.type.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
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
