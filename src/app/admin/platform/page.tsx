"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Building2,
  Users,
  Store,
  QrCode,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Sliders,
  Check,
  AlertCircle,
  X,
  Lock,
  Mail,
  Phone,
  Calendar,
  LogOut,
  TrendingUp,
  Eye,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

interface ShopData {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  status: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  actionsCount: number;
  customersCount: number;
  feedbacksCount: number;
  clientName?: string;
  clientEmail?: string;
}

interface ClientData {
  id: string;
  userId: string;
  companyName: string;
  plan: string;
  status: string;
  maxShops: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: string;
    status: string;
  };
  shops: ShopData[];
}

interface PlatformMetrics {
  totalClients: number;
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  totalEngagements: number;
  totalCustomers?: number;
  estimatedMrr?: number;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.35,
      ease: "easeOut" as const,
    },
  }),
};

export default function PlatformAdminDashboardPage() {
  const router = useRouter();

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Provisioning Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    plan: "GROWTH",
    shopName: "",
    shopSlug: "",
    primaryColor: "#0F766E",
  });

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/platform/overview");
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.data.metrics);
        setClients(json.data.clients);
      } else {
        setErrorMessage(json.error?.message || "Failed to load platform data");
      }
    } catch {
      setErrorMessage("Network error connecting to platform administration services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleShopStatus = async (shopId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/platform/shops/${shopId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(`Venue status updated to ${nextStatus}.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData();
      } else {
        setErrorMessage(json.error?.message || "Failed to update venue status.");
      }
    } catch {
      setErrorMessage("Network error while updating venue status.");
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/platform/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(`Client account "${formData.companyName}" successfully provisioned.`);
        setTimeout(() => setSuccessMessage(null), 4000);
        setIsModalOpen(false);
        setFormData({
          clientName: "",
          companyName: "",
          email: "",
          phone: "",
          password: "",
          plan: "GROWTH",
          shopName: "",
          shopSlug: "",
          primaryColor: "#0F766E",
        });
        fetchData();
      } else {
        setErrorMessage(json.error?.message || "Failed to provision client.");
      }
    } catch {
      setErrorMessage("Network error provisioning client account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.user.name && client.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      client.shops.some(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesPlan = planFilter === "ALL" || client.plan === planFilter;
    const matchesStatus = statusFilter === "ALL" || client.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Header (Fluid width, fitted to screen on all zoom levels) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center justify-between gap-4">
          {/* Left: Brand Logo, Noura name, Platform Administration & SUPER ADMIN */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-slate-200/90 overflow-hidden p-1 shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/images/Own brand logo.png"
                alt="Noura"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold tracking-tight text-base sm:text-xl text-slate-900 leading-none">
                  Noura
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800 leading-none">
                  Platform Administration
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium mt-1 truncate">
                Multi-Tenant Client Venues & Platform Distribution Management
              </p>
            </div>
          </div>

          {/* Right: /r/hari2-cafe Link, Actions, Refresh, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Direct /r/hari2-cafe Quick Access */}
            <Link
              href="/r/hari2-cafe"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition shadow-2xs group"
              title="Open Hari2 Cafe Diner Hub"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-700 group-hover:translate-x-0.5 transition-transform" />
              <span className="font-mono text-[11.5px]">/r/hari2-cafe</span>
            </Link>

            <button
              onClick={fetchData}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-700" : ""}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-800/15 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Onboard New Client</span>
              <span className="sm:hidden">New Client</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content (Fluid width, fits entire screen on zoom-in / zoom-out) */}
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800 text-xs font-bold"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Card 1: Total Clients */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 transition-shadow hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Clients
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {metrics ? metrics.totalClients : "—"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                Active Tenant Accounts
              </span>
            </div>
          </motion.div>

          {/* Card 2: Provisioned Venues */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 transition-shadow hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Provisioned Venues
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {metrics ? metrics.totalShops : "—"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                {metrics ? `${metrics.activeShops} Active Venues` : "—"}
              </span>
            </div>
          </motion.div>

          {/* Card 3: Guest Engagements */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 transition-shadow hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Guest Engagements
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {metrics ? metrics.totalEngagements.toLocaleString() : "—"}
              </span>
              <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                Hub Touchpoint Hits
              </span>
            </div>
          </motion.div>

          {/* Card 4: Estimated MRR (Replacing Loyalty Stamps) */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 transition-shadow hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated MRR
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                ${metrics?.estimatedMrr ? metrics.estimatedMrr.toLocaleString() : "1,341"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                Monthly Recurring Revenue
              </span>
            </div>
          </motion.div>
        </div>

        {/* 4. Section Bar & Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full">
          {/* Section Title: Clients & Their Venues */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                Clients & Their Venues
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                {filteredClients.length} {filteredClients.length === 1 ? "Account" : "Accounts"} Configured
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2.5 flex-wrap flex-1 justify-end">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients, company, venues, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Plans</option>
              <option value="STARTER">Starter</option>
              <option value="GROWTH">Growth</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* 5. Clients & Their Venues List */}
        <div className="space-y-4 w-full">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs">
              No clients match your filter criteria.
            </div>
          ) : (
            filteredClients.map((client, idx) => {
              const isExpanded = expandedClientId === client.id;
              return (
                <motion.div
                  key={client.id}
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Client Header Row */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {client.companyName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">
                            {client.companyName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {client.plan}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              client.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {client.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {client.user.name || "Owner"}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {client.user.email}
                          </span>
                          {client.user.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {client.user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(client.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                      <div className="text-right mr-2">
                        <span className="text-sm font-extrabold text-slate-900 block font-mono">
                          {client.shops.length} / {client.maxShops}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Venues Registered
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Venues" : "View Venues"}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Venues Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="bg-slate-50/70 border-t border-slate-200/80 px-5 py-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Venues Managed by {client.companyName} ({client.shops.length})
                          </span>
                        </div>

                        {client.shops.length === 0 ? (
                          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                            This client has not added any venues yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                            {client.shops.map((shop) => (
                              <div
                                key={shop.id}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 transition-all hover:border-slate-300"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                                      style={{ backgroundColor: shop.primaryColor }}
                                    />
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                                        {shop.name}
                                      </h4>
                                      <span className="text-[11px] font-mono text-slate-400 truncate block">
                                        /r/{shop.slug}
                                      </span>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                      shop.status === "ACTIVE"
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                    }`}
                                  >
                                    {shop.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-slate-100 text-center text-[10px]">
                                  <div>
                                    <span className="font-bold text-slate-800 block font-mono">
                                      {shop.actionsCount}
                                    </span>
                                    <span className="text-slate-400">Touchpoints</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block font-mono">
                                      {shop.customersCount}
                                    </span>
                                    <span className="text-slate-400">Customers</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block font-mono">
                                      {shop.feedbacksCount}
                                    </span>
                                    <span className="text-slate-400">Feedback</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                  <Link
                                    href={`/admin/restaurants/${shop.id}/dashboard`}
                                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold text-center transition flex items-center justify-center gap-1.5"
                                    title="Open and manage venue dashboard"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>Manage Venue</span>
                                  </Link>
                                  <a
                                    href={`/r/${shop.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                    title="Open Live Guest Page"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handleToggleShopStatus(shop.id, shop.status)}
                                    className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-semibold transition"
                                    title="Toggle operational status"
                                  >
                                    {shop.status === "ACTIVE" ? "Suspend" : "Activate"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* 6. Onboard New Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Onboard New Client Account
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provision a new tenant company and their initial venue hub.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Client Company & User Info */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    1. Account & Organization
                  </span>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Company / Brand Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Blue Harbor Hospitality"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Owner Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Owner Email</label>
                      <input
                        type="email"
                        required
                        placeholder="owner@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 555-0199"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Initial Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Subscription Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="STARTER">Starter ($49/mo - Up to 2 Venues)</option>
                      <option value="GROWTH">Growth ($149/mo - Up to 10 Venues)</option>
                      <option value="ENTERPRISE">Enterprise ($299/mo - Unlimited Venues)</option>
                    </select>
                  </div>
                </div>

                {/* Initial Venue Info */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    2. First Provisioned Venue
                  </span>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Venue Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Downtown Bistro"
                      value={formData.shopName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, "");
                        setFormData({ ...formData, shopName: name, shopSlug: slug });
                      }}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Venue URL Slug</label>
                      <div className="flex items-center">
                        <span className="px-2 h-9 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-[11px] flex items-center">
                          /r/
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="downtown-bistro"
                          value={formData.shopSlug}
                          onChange={(e) => setFormData({ ...formData, shopSlug: e.target.value })}
                          className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-r-xl font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Brand Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="flex-1 h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold transition shadow-xs flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <span>Complete Onboarding</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
