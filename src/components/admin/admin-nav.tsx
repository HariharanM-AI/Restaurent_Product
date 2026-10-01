"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./admin-shell";
import {
  LayoutDashboard,
  Award,
  MessageSquare,
  Layers,
  Wifi,
  QrCode,
  BarChart3,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  X,
  Building2,
  Sparkles,
  UtensilsCrossed,
  PanelLeftClose,
  Store,
  ChevronDown,
  Check,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Coffee,
  Hotel,
  ShieldCheck,
} from "lucide-react";

export interface VenueItem {
  id: string;
  name: string;
  slug: string;
  primaryColor?: string;
  logoUrl?: string | null;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  status?: string;
  role?: string;
}

interface AdminNavProps {
  restaurant: VenueItem;
  restaurants?: VenueItem[];
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
}

export function AdminNav({ restaurant, restaurants = [], user }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed, toggle } = useSidebar();

  // Multi-venue state
  const [venuesList, setVenuesList] = useState<VenueItem[]>(
    restaurants.length > 0 ? restaurants : [restaurant]
  );
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);

  // Client profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name || "Marcus Vance");
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileAddress, setProfileAddress] = useState(user.address || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // New venue modal form state
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueType, setNewVenueType] = useState("Cafe");
  const [newVenueTagline, setNewVenueTagline] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [newVenuePhone, setNewVenuePhone] = useState("");
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [createVenueError, setCreateVenueError] = useState<string | null>(null);

  // Resolve active restaurant from current URL or fallback
  const match = pathname.match(/\/admin\/restaurants\/([^/]+)/);
  const urlRestaurantId = match ? match[1] : null;
  const activeRestaurant =
    venuesList.find((v) => v.id === urlRestaurantId) ||
    venuesList.find((v) => v.id === restaurant.id) ||
    restaurant;

  // Sync venuesList when props update
  useEffect(() => {
    if (restaurants && restaurants.length > 0) {
      setVenuesList(restaurants);
    }
  }, [restaurants]);

  // Sync user profile inputs if user prop changes
  useEffect(() => {
    if (user.name) setProfileName(user.name);
    if (user.phone) setProfilePhone(user.phone);
    if (user.address) setProfileAddress(user.address);
  }, [user.name, user.phone, user.address]);

  // Listen for real-time restaurant profile updates (name or logoUrl)
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ id?: string; name?: string; logoUrl?: string | null }>;
      if (customEvent.detail) {
        const { id, name, logoUrl } = customEvent.detail;
        setVenuesList((prev) =>
          prev.map((v) => {
            if (!id || v.id === id || (!id && v.id === activeRestaurant.id)) {
              return {
                ...v,
                name: name !== undefined ? name : v.name,
                logoUrl: logoUrl !== undefined ? logoUrl : v.logoUrl,
              };
            }
            return v;
          })
        );
      }
    };
    window.addEventListener("restaurant-updated", handleUpdate);
    return () => {
      window.removeEventListener("restaurant-updated", handleUpdate);
    };
  }, [activeRestaurant.id]);

  // Subpath preservation for seamless venue switching
  const currentSubPath = pathname.replace(/^\/admin\/restaurants\/[^/]+/, "") || "/dashboard";

  const handleSwitchVenue = (venue: VenueItem) => {
    setIsVenueDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setIsProfileModalOpen(false);
    router.push(`/admin/restaurants/${venue.id}${currentSubPath}`);
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    setIsCreatingVenue(true);
    setCreateVenueError(null);

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVenueName.trim(),
          tagline: newVenueTagline.trim() || `${newVenueType} & Hospitality Hub`,
          address: newVenueAddress.trim() || null,
          phone: newVenuePhone.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const created: VenueItem = json.data;
        setVenuesList((prev) => [...prev, created]);
        setIsAddVenueModalOpen(false);
        setNewVenueName("");
        setNewVenueTagline("");
        setNewVenueAddress("");
        setNewVenuePhone("");
        router.push(`/admin/restaurants/${created.id}/dashboard`);
        router.refresh();
      } else {
        setCreateVenueError(json.error || "Failed to create venue");
      }
    } catch {
      setCreateVenueError("Network error. Please try again.");
    } finally {
      setIsCreatingVenue(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          address: profileAddress,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setProfileSuccess("Profile updated successfully.");
        setTimeout(() => setProfileSuccess(null), 3500);
        router.refresh();
      } else {
        setProfileError(json.error || "Failed to update profile");
      }
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: `/admin/restaurants/${activeRestaurant.id}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Menu Manager",
      href: `/admin/restaurants/${activeRestaurant.id}/menu`,
      icon: UtensilsCrossed,
    },
    {
      label: "Loyalty & Stamps",
      href: `/admin/restaurants/${activeRestaurant.id}/loyalty`,
      icon: Award,
    },
    {
      label: "Guest Feedback",
      href: `/admin/restaurants/${activeRestaurant.id}/feedback`,
      icon: MessageSquare,
    },
    {
      label: "Guest Actions",
      href: `/admin/restaurants/${activeRestaurant.id}/actions`,
      icon: Layers,
    },
    {
      label: "Guest Wi-Fi",
      href: `/admin/restaurants/${activeRestaurant.id}/wifi`,
      icon: Wifi,
    },
    {
      label: "QR & Touchpoints",
      href: `/admin/restaurants/${activeRestaurant.id}/qr`,
      icon: QrCode,
    },
    {
      label: "Analytics",
      href: `/admin/restaurants/${activeRestaurant.id}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Restaurant Profile",
      href: `/admin/restaurants/${activeRestaurant.id}/branding`,
      icon: Store,
    },
  ];

  const userInitials = (profileName || user.name || "Owner")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "OW";

  const restaurantInitials = (activeRestaurant.name.trim())
    .slice(0, 2)
    .toUpperCase() || "RS";

  return (
    <>
      {/* ── Top Mobile Bar ── */}
      <header className="lg:hidden bg-[#111111] text-white px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-white/20 flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-xs">
            <img
              src="/images/Own brand logo.png"
              alt="Noura"
              className="w-full h-full object-contain"
            />
          </div>
          <div
            onClick={() => setIsMobileMenuOpen(true)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold text-white text-sm block leading-tight shrink-0">
                Noura
              </span>
              <span className="text-white/30 text-xs shrink-0">•</span>
              <span className="text-xs text-white/85 font-semibold truncate max-w-[120px]">
                {activeRestaurant.name}
              </span>
              <ChevronDown className="w-3 h-3 text-white/50 shrink-0" />
            </div>
            <span className="text-[10px] text-emerald-300/80 font-medium block">Turn Guests into Regulars</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/r/${activeRestaurant.slug}?preview=true`}
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
          width: isCollapsed ? 72 : 260,
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
        {/* Toggle Button & Collapsed Brand Icon */}
        <div className={`flex pt-3.5 pb-2 shrink-0 ${isCollapsed ? "flex-col items-center gap-2 px-2" : "justify-end px-3"}`}>
          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-white border border-white/20 flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden" title="Noura">
              <img src="/images/Own brand logo.png" alt="Noura" className="w-full h-full object-contain" />
            </div>
          )}
          <motion.button
            onClick={toggle}
            className="w-9 h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <PanelLeftClose className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        {/* Brand Header & Venue Switcher Pill (only when expanded) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="px-4"
            >
              <div className="pb-3 pt-1">
                {/* Product Brand Header (Noura + Custom Brand Logo) */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-white border border-white/20 flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-xs">
                    <img
                      src="/images/Own brand logo.png"
                      alt="Noura Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-extrabold text-base tracking-tight leading-none">
                      Noura
                    </div>
                    <div className="text-[10px] text-emerald-300/80 font-medium tracking-wide mt-1">
                      Turn Guests into Regulars
                    </div>
                  </div>
                </div>

                {/* ── Cafe / Hotel Selector Pill & Dropdown ── */}
                <div className="relative mt-3">
                  <div
                    onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                    className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between cursor-pointer hover:bg-white/[0.09] transition select-none group"
                    title="Click to view or switch cafes and hotels"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Respective Cafe or Hotel Logo (instead of "HA") */}
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {activeRestaurant.logoUrl ? (
                          <img
                            src={activeRestaurant.logoUrl}
                            alt={activeRestaurant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                            {restaurantInitials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-bold text-xs truncate leading-tight group-hover:text-emerald-300 transition-colors">
                          {activeRestaurant.name}
                        </div>
                        <div className="text-[10px] text-white/40 truncate mt-0.5">
                          {activeRestaurant.address || activeRestaurant.tagline || "Downtown • Venue"}
                        </div>
                      </div>
                    </div>
                    <div className="w-4 h-4 text-white/40 group-hover:text-white shrink-0 flex items-center justify-center transition-colors">
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isVenueDropdownOpen ? "rotate-180 text-emerald-400" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* ── Dropdown Menu for Switching and Adding Venues ── */}
                  <AnimatePresence>
                    {isVenueDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 mt-2 p-2 rounded-2xl bg-[#1c1c1f] border border-white/10 shadow-2xl space-y-1 z-50 backdrop-blur-xl"
                      >
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center justify-between">
                          <span>Your Venues</span>
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                            {venuesList.length}
                          </span>
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                          {venuesList.map((venue) => {
                            const isCurrent = venue.id === activeRestaurant.id;
                            return (
                              <button
                                key={venue.id}
                                type="button"
                                onClick={() => handleSwitchVenue(venue)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                                  isCurrent
                                    ? "bg-white/10 text-white font-bold border border-white/10"
                                    : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                    {venue.logoUrl ? (
                                      <img
                                        src={venue.logoUrl}
                                        alt={venue.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[10px] font-bold text-white/80">
                                        {venue.name.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs truncate leading-tight">
                                      {venue.name}
                                    </div>
                                    <div className="text-[9px] text-white/40 truncate">
                                      {venue.address || venue.tagline || "Active Venue"}
                                    </div>
                                  </div>
                                </div>
                                {isCurrent && (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="border-t border-white/[0.08] pt-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsVenueDropdownOpen(false);
                              setIsAddVenueModalOpen(true);
                            }}
                            className="w-full py-2 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add New Cafe or Hotel</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Menu (Dynamically Scoped to activeRestaurant.id) */}
        <nav className="flex-1 px-2 py-1.5 space-y-1 overflow-hidden select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isCollapsed
                    ? "justify-center px-0 mx-auto w-10 h-10 shrink-0"
                    : "gap-3 px-3.5 py-2"
                } ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-lg shadow-black/10"
                    : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl bg-white/[0.12] border border-white/[0.08]"
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

        {/* Live Guest Experience Banner (Expanded mode) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 pb-2 pt-1"
            >
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-[#181818] border border-emerald-500/20 shadow-inner">
                <div className="text-xs font-bold text-white mb-2 leading-tight">
                  Your guest experience is live!
                </div>
                <Link
                  href={`/r/${activeRestaurant.slug}?preview=true`}
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

        {/* ── Client Owner Footer (Clickable to open Client Profile) ── */}
        <div className={`border-t border-white/[0.06] bg-black/20 shrink-0 ${isCollapsed ? "p-2" : "p-3"}`}>
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center rounded-xl hover:bg-white/[0.08] transition cursor-pointer group ${
              isCollapsed ? "justify-center p-1" : "justify-between p-1.5"
            }`}
            title="Click to view Client Profile, Venues & Contact Info"
          >
            <div className={`flex items-center min-w-0 ${isCollapsed ? "" : "gap-2.5"}`}>
              <div
                className="w-9 h-9 rounded-full bg-emerald-600/80 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/40 group-hover:scale-105 transition-transform"
                title={profileName}
              >
                {userInitials}
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-0 text-left"
                >
                  <div className="font-bold text-xs text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                    {profileName}
                  </div>
                  <div className="text-[10px] text-white/40 truncate mt-0.5 flex items-center gap-1">
                    <span>Owner</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                    <span className="text-emerald-400/80">Profile</span>
                  </div>
                </motion.div>
              )}
            </div>
            {!isCollapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  signOut({ callbackUrl: "/login" });
                }}
                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-80 max-w-[85vw] bg-[#111111] text-white h-full flex flex-col shadow-2xl z-10 border-r border-white/10"
              style={{ borderRadius: "0 24px 24px 0" }}
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-white border border-white/20 flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-xs">
                    <img
                      src="/images/Own brand logo.png"
                      alt="Noura"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm text-white tracking-tight">
                      Noura
                    </h2>
                    <span className="text-[10px] text-emerald-300/80 font-medium block">
                      Turn Guests into Regulars
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Venues Switcher */}
              <div className="p-3 border-b border-white/[0.06] bg-black/20">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                  Switch Venue ({venuesList.length})
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {venuesList.map((venue) => {
                    const isCurrent = venue.id === activeRestaurant.id;
                    return (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => handleSwitchVenue(venue)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                          isCurrent
                            ? "bg-white/10 text-white font-bold"
                            : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="truncate">{venue.name}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAddVenueModalOpen(true);
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cafe or Hotel</span>
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

              <div className="p-4 border-t border-white/[0.06] bg-black/20 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>{profileName} (Profile)</span>
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs border border-red-500/30 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: ADD NEW CAFE OR HOTEL ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddVenueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => !isCreatingVenue && setIsAddVenueModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#141416] border border-white/[0.09] rounded-3xl p-6 sm:p-7 text-white shadow-2xl shadow-black/80 z-10 overflow-hidden"
            >
              {/* Subtle Ambient Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="relative flex items-start justify-between mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                      Register New Cafe or Hotel
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Add another dining location or hotel property to your Noura hub.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddVenueModalOpen(false)}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createVenueError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-medium flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{createVenueError}</span>
                </div>
              )}

              <form onSubmit={handleCreateVenue} className="space-y-4 relative">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Venue Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hari Cafe Marina or Grand Horizon Hotel"
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                    />
                    <Building2 className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-2">
                    Venue Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: "Cafe", icon: Coffee },
                      { type: "Hotel", icon: Hotel },
                      { type: "Restaurant", icon: UtensilsCrossed },
                      { type: "Bistro", icon: Sparkles },
                      { type: "Bar & Lounge", icon: Layers },
                      { type: "Bakery", icon: Store },
                    ].map(({ type, icon: CatIcon }) => {
                      const isSelected = newVenueType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewVenueType(type)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 ${
                            isSelected
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-xs"
                              : "bg-white/[0.03] text-white/60 border-white/[0.07] hover:bg-white/[0.06] hover:text-white/80"
                          }`}
                        >
                          <CatIcon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-white/40"}`} />
                          <span className="truncate">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Concept Tagline
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Artisanal specialty coffee, pastries & brunch"
                      value={newVenueTagline}
                      onChange={(e) => setNewVenueTagline(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                    />
                    <Sparkles className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Physical Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 142 Ocean Boulevard"
                        value={newVenueAddress}
                        onChange={(e) => setNewVenueAddress(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                      />
                      <MapPin className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. (555) 019-2831"
                        value={newVenuePhone}
                        onChange={(e) => setNewVenuePhone(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                      />
                      <Phone className="w-4 h-4 text-white/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsAddVenueModalOpen(false)}
                    disabled={isCreatingVenue}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white/70 hover:text-white text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingVenue || !newVenueName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingVenue && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isCreatingVenue ? "Registering..." : "Register Venue"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: CLIENT PROFILE & VENUES PORTFOLIO ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => !isSavingProfile && setIsProfileModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl bg-[#141416] border border-white/[0.09] rounded-3xl text-white shadow-2xl shadow-black/80 z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header Banner */}
              <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-[#18181b] to-[#141416] border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/30 text-white font-bold text-sm flex items-center justify-center shadow-md shrink-0">
                    {userInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-white tracking-tight leading-none">
                        {profileName}
                      </h3>
                    </div>
                    <p className="text-xs text-white/50 mt-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-white/40" />
                      <span>{user.email || "client@noura.io"}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {profileSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {/* Section 1: Personal & Contact Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Personal Details & Contact</span>
                  </h4>

                  <form onSubmit={handleSaveProfile} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full h-10 pl-9 pr-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                        />
                        <User className="w-3.5 h-3.5 text-white/35 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-white/70 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            disabled
                            value={user.email || ""}
                            className="w-full h-10 pl-9 pr-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-white/50 cursor-not-allowed"
                          />
                          <Mail className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/70 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. (555) 234-8901"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full h-10 pl-9 pr-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                          />
                          <Phone className="w-3.5 h-3.5 text-white/35 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        Headquarters / Business Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 428 Market Street, Suite 100, San Francisco, CA"
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          className="w-full h-10 pl-9 pr-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition"
                        />
                        <MapPin className="w-3.5 h-3.5 text-white/35 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="pt-1.5 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isSavingProfile ? "Saving..." : "Save Profile Details"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 2: List of Cafes & Hotels */}
                <div className="border-t border-white/[0.08] pt-5">
                  <div className="flex items-center justify-between mb-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      <span>Connected Venues & Locations ({venuesList.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        setIsAddVenueModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-300 hover:text-emerald-200 transition flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Venue</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {venuesList.map((venue) => {
                      const isCurrent = venue.id === activeRestaurant.id;
                      return (
                        <div
                          key={venue.id}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isCurrent
                              ? "bg-emerald-950/20 border-emerald-500/30 shadow-xs"
                              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                              {venue.logoUrl ? (
                                <img
                                  src={venue.logoUrl}
                                  alt={venue.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-white/80">
                                  {venue.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">
                                  {venue.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40 truncate mt-0.5">
                                {venue.address || venue.tagline || `/r/${venue.slug}`}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCurrent ? (
                              <span className="text-xs font-semibold text-emerald-400 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Selected</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSwitchVenue(venue)}
                                className="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition cursor-pointer"
                              >
                                Switch
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Logout / Sign Out Button */}
                <div className="border-t border-white/[0.08] pt-5">
                  <div className="p-4 rounded-2xl bg-red-950/15 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-white">Security & Session</h5>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        Safely sign out of your account on this device.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-red-950/40 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
