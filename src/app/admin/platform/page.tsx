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
  Award,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Sliders,
  Check,
  AlertCircle,
  X,
  Lock,
  Mail,
  Phone,
  Calendar,
  LogOut,
  ArrowUpRight,
  TrendingUp,
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
  totalLoyaltyStamps: number;
}

export default function PlatformAdminDashboardPage() {
  const router = useRouter();

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [allShops, setAllShops] = useState<ShopData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<"clients" | "shops">("clients");
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
        setAllShops(json.data.allShops);
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
      client.shops.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlan = planFilter === "ALL" || client.plan === planFilter;
    const matchesStatus = statusFilter === "ALL" || client.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Filter all shops
  const filteredShops = allShops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.clientName && shop.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || shop.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16 selection:bg-teal-500 selection:text-white">
      {/* 1. Master Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#072C27] text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Noura Platform Administration
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Multi-Tenant Client Venues & Platform Distribution Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-600" : ""}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#072C27] hover:bg-[#0E473F] text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Client</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-7">
        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* 2. Platform KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
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
              <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                Active Tenant Accounts
              </span>
            </div>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Provisioned Shops
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {metrics ? metrics.totalShops : "—"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                {metrics ? `${metrics.activeShops} Active Venues` : "—"}
              </span>
            </div>
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
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

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Loyalty Stamps
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {metrics ? metrics.totalLoyaltyStamps.toLocaleString() : "—"}
              </span>
              <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                Distributed Across Shops
              </span>
            </div>
          </motion.div>
        </div>

        {/* 3. Filter Controls & Tab Switcher */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("clients")}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "clients" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Clients & Their Shops ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("shops")}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "shops" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Managed Shops ({allShops.length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2.5 flex-wrap flex-1 justify-end">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === "clients"
                    ? "Search clients, company, email..."
                    : "Search shops, slugs, clients..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
              />
            </div>

            {activeTab === "clients" && (
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
            )}

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

        {/* 4. Tab 1: Clients & Respective Shops (Hierarchical View) */}
        {activeTab === "clients" && (
          <div className="space-y-4">
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
                            Shops Registered
                          </span>
                        </div>

                        <button
                          onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{isExpanded ? "Hide Shops" : "View Shops"}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Shops Drawer */}
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
                              Shops Managed by {client.companyName} ({client.shops.length})
                            </span>
                          </div>

                          {client.shops.length === 0 ? (
                            <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                              This client has not added any shops yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                              {client.shops.map((shop) => (
                                <div
                                  key={shop.id}
                                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                                        style={{ backgroundColor: shop.primaryColor }}
                                      />
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                          {shop.name}
                                        </h4>
                                        <span className="text-[11px] font-mono text-slate-400">
                                          /r/{shop.slug}
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
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
                                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold text-center transition"
                                    >
                                      Manage Venue
                                    </Link>
                                    <a
                                      href={`/r/${shop.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                      title="Open Guest Page"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                      onClick={() => handleToggleShopStatus(shop.id, shop.status)}
                                      className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-semibold transition"
                                      title="Toggle Active/Suspended"
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
        )}

        {/* 5. Tab 2: All Managed Shops (Flat Table Directory) */}
        {activeTab === "shops" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-5">Venue & Slug</th>
                    <th className="py-3.5 px-5">Client / Owner</th>
                    <th className="py-3.5 px-5">Brand Accent</th>
                    <th className="py-3.5 px-5">Touchpoints</th>
                    <th className="py-3.5 px-5">Created</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No shops match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 block text-sm">
                            {shop.name}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            /r/{shop.slug}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-slate-800 block">
                            {shop.clientName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {shop.clientEmail}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: shop.primaryColor }}
                            />
                            <span className="font-mono text-[11px] text-slate-600">
                              {shop.primaryColor}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono font-semibold text-slate-700">
                          {shop.actionsCount} actions
                        </td>
                        <td className="py-3.5 px-5 text-slate-400">
                          {new Date(shop.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              shop.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {shop.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/restaurants/${shop.id}/dashboard`}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                            >
                              Manage
                            </Link>
                            <a
                              href={`/r/${shop.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Open Guest Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleToggleShopStatus(shop.id, shop.status)}
                              className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-semibold transition"
                            >
                              {shop.status === "ACTIVE" ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 6. Onboard Client Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Onboard New SaaS Client
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register a client account and provision their initial restaurant venue.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Client Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Company / Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Skyline Hospitality Group"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Client Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="client@hospitality.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      SaaS Plan Tier
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="STARTER">Starter Tier (Up to 3 Venues)</option>
                      <option value="GROWTH">Growth Tier (Up to 10 Venues)</option>
                      <option value="ENTERPRISE">Enterprise Tier (Unlimited)</option>
                    </select>
                  </div>
                </div>

                {/* Initial Shop Fields */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Initial Shop Venue (Optional)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Initial Venue Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Skyline Bistro Downtown"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Brand Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="flex-1 h-10 px-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#072C27] hover:bg-[#0E473F] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Provisioning..." : "Provision Client"}
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
