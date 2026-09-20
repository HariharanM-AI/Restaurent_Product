"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./admin-shell";
import {
  LayoutDashboard,
  Users,
  Award,
  MessageSquare,
  Layers,
  Wifi,
  QrCode,
  BarChart3,
  Palette,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  X,
  Building2,
  Sparkles,
  UtensilsCrossed,
  PanelLeftClose,
} from "lucide-react";

interface AdminNavProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    primaryColor?: string;
  };
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminNav({ restaurant, user }: AdminNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed, toggle } = useSidebar();

  const navItems = [
    {
      label: "Dashboard",
      href: `/admin/restaurants/${restaurant.id}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Menu Manager",
      href: `/admin/restaurants/${restaurant.id}/menu`,
      icon: UtensilsCrossed,
    },
    {
      label: "Customers & VIPs",
      href: `/admin/restaurants/${restaurant.id}/customers`,
      icon: Users,
    },
    {
      label: "Loyalty & Stamps",
      href: `/admin/restaurants/${restaurant.id}/loyalty`,
      icon: Award,
    },
    {
      label: "Guest Feedback",
      href: `/admin/restaurants/${restaurant.id}/feedback`,
      icon: MessageSquare,
    },
    {
      label: "Guest Actions",
      href: `/admin/restaurants/${restaurant.id}/actions`,
      icon: Layers,
    },
    {
      label: "Guest Wi-Fi",
      href: `/admin/restaurants/${restaurant.id}/wifi`,
      icon: Wifi,
    },
    {
      label: "QR & Touchpoints",
      href: `/admin/restaurants/${restaurant.id}/qr`,
      icon: QrCode,
    },
    {
      label: "Analytics",
      href: `/admin/restaurants/${restaurant.id}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Branding & Theme",
      href: `/admin/restaurants/${restaurant.id}/branding`,
      icon: Palette,
    },
  ];

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <>
      {/* ── Top Mobile Bar ── */}
      <header className="lg:hidden bg-[#111111] text-white px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-white text-sm block leading-tight truncate max-w-[160px]">
              {restaurant.name}
            </span>
            <span className="text-[10px] text-emerald-300/70 block">GuestLink Control</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/r/${restaurant.slug}`}
            target="_blank"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 border border-white/10 transition"
            title="Preview Live Guest Experience"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Desktop Sidebar (Animated Collapse/Expand) ── */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 256,
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-[#111111] shrink-0 select-none text-white z-30 overflow-hidden"
        style={{
          borderRadius: "0 24px 24px 0",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Toggle Button — right side corner */}
        <div className={`flex pt-4 pb-2 ${isCollapsed ? 'justify-center px-2' : 'justify-end px-3'}`}>
          <motion.button
            onClick={toggle}
            className="w-10 h-10 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <PanelLeftClose className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </div>

        {/* Brand Header (only when expanded) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden px-4"
            >
              <div className="pb-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-extrabold text-base tracking-tight leading-none">
                      GuestLink
                    </div>
                    <div className="text-[10px] text-emerald-300/80 font-medium tracking-wide mt-1">
                      Turn Guests into Regulars
                    </div>
                  </div>
                </div>

                {/* Restaurant Selector Pill */}
                <div className="mt-3 p-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer hover:bg-white/[0.08] transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                      {restaurant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-xs truncate leading-tight">
                        {restaurant.name}
                      </div>
                      <div className="text-[10px] text-white/40 truncate mt-0.5">
                        Downtown • Restaurant
                      </div>
                    </div>
                  </div>
                  <div className="w-4 h-4 text-white/30 shrink-0 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Menu */}
        <nav className="flex-1 min-h-0 px-2 py-2 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex items-center rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isCollapsed
                    ? "justify-center px-0 py-3 mx-auto w-12 h-12"
                    : "gap-3 px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-lg shadow-black/10"
                    : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-2xl bg-white/[0.12] border border-white/[0.08]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 relative z-10 transition-colors ${
                    isActive
                      ? "text-emerald-300 stroke-[2.2px]"
                      : "text-white/40 group-hover:text-white/70 stroke-[1.8px]"
                  }`}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#222] text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl z-50 border border-white/10">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#222] rotate-45 border-l border-b border-white/10" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Guest Experience Card (expanded only) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden px-3"
            >
              <div className="mb-2 p-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white">
                <div className="text-xs font-bold text-white mb-2 leading-tight">
                  Your guest experience is live!
                </div>
                <Link
                  href={`/r/${restaurant.slug}`}
                  target="_blank"
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#111] text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <span>View Guest Experience</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#111]" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Auxiliary Links */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 border-t border-white/[0.06] space-y-0.5 text-xs text-white/50">
                <Link
                  href={`/admin/restaurants/${restaurant.id}/branding`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:text-white hover:bg-white/[0.06] transition"
                >
                  <Building2 className="w-4 h-4 text-white/30" />
                  <span>Restaurant Profile</span>
                </Link>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:text-white hover:bg-white/[0.06] transition cursor-pointer">
                  <Sparkles className="w-4 h-4 text-white/30" />
                  <span>Help & Support</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Account Footer */}
        <div className={`border-t border-white/[0.06] bg-black/20 ${isCollapsed ? "p-2" : "p-3"}`}>
          <div
            className={`flex items-center rounded-2xl hover:bg-white/[0.06] transition cursor-pointer ${
              isCollapsed ? "justify-center p-2" : "justify-between p-1.5"
            }`}
          >
            <div className={`flex items-center min-w-0 ${isCollapsed ? "" : "gap-2.5"}`}>
              <div
                className="w-9 h-9 rounded-full bg-emerald-600/80 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/40"
                title={isCollapsed ? `${user.name || "Admin"} • Sign Out` : undefined}
              >
                {userInitials}
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-0"
                >
                  <div className="font-bold text-xs text-white truncate leading-tight">
                    {user.name || "Alex Morgan"}
                  </div>
                  <div className="text-[10px] text-white/40 truncate mt-0.5">
                    Owner
                  </div>
                </motion.div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1 text-white/30 hover:text-white transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-72 max-w-[85vw] bg-[#111111] text-white h-full flex flex-col shadow-2xl z-10 border-r border-white/10"
              style={{ borderRadius: "0 24px 24px 0" }}
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm text-white truncate">{restaurant.name}</h2>
                    <span className="text-[10px] text-white/40 block">/r/{restaurant.slug}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-white/[0.12] text-white shadow-xs font-bold"
                          : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/[0.06] bg-black/20">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-red-500/20 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
