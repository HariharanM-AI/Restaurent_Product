"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Moon,
  Sun,
  Search,
  X,
  LayoutDashboard,
  UtensilsCrossed,
  Award,
  MessageSquare,
  Layers,
  Wifi,
  QrCode,
  BarChart3,
  Store,
  Users,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

interface AdminHeaderProps {
  restaurantName: string;
  restaurantSlug: string;
  restaurants?: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    address?: string | null;
    tagline?: string | null;
  }>;
}

export function AdminHeader({ restaurantName, restaurantSlug, restaurants = [] }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const match = pathname.match(/\/admin\/restaurants\/([^/]+)/);
  const activeId = match ? match[1] : null;
  const activeFromList = restaurants.find((r) => r.id === activeId);

  const initialName = activeFromList?.name || restaurantName;
  const [currentName, setCurrentName] = useState(initialName);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isVenueOpen, setIsVenueOpen] = useState(false);
  const venueRef = useRef<HTMLDivElement>(null);

  const searchRoutes = [
    { title: "Dashboard", href: `/admin/restaurants/${activeId}/dashboard`, icon: LayoutDashboard, desc: "Key metrics & guest interactions" },
    { title: "Menu Manager", href: `/admin/restaurants/${activeId}/menu`, icon: UtensilsCrossed, desc: "Digital & PDF menu catalog" },
    { title: "Loyalty & Stamps", href: `/admin/restaurants/${activeId}/loyalty`, icon: Award, desc: "Digital stamps & rewards" },
    { title: "Guest Feedback", href: `/admin/restaurants/${activeId}/feedback`, icon: MessageSquare, desc: "Reviews, ratings & suggestions" },
    { title: "Guest Actions", href: `/admin/restaurants/${activeId}/actions`, icon: Layers, desc: "Interactive cards on guest hub" },
    { title: "Guest Wi-Fi", href: `/admin/restaurants/${activeId}/wifi`, icon: Wifi, desc: "One-tap network credentials" },
    { title: "QR & Touchpoints", href: `/admin/restaurants/${activeId}/qr`, icon: QrCode, desc: "Table tent QR & NFC setup" },
    { title: "Analytics", href: `/admin/restaurants/${activeId}/analytics`, icon: BarChart3, desc: "Conversion & traffic insights" },
    { title: "Restaurant Profile", href: `/admin/restaurants/${activeId}/branding`, icon: Store, desc: "Identity, photos, theme & contact" },
    { title: "Customer Directory", href: `/admin/restaurants/${activeId}/customers`, icon: Users, desc: "Guest CRM & repeat visits" },
  ];

  const filteredRoutes = searchQuery.trim()
    ? searchRoutes.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchRoutes;

  useEffect(() => {
    if (activeFromList) {
      setCurrentName(activeFromList.name);
    } else {
      setCurrentName(restaurantName);
    }
  }, [activeFromList?.name, restaurantName]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ id?: string; name: string }>;
      if (customEvent.detail?.name && (!customEvent.detail.id || customEvent.detail.id === activeId)) {
        setCurrentName(customEvent.detail.name);
      }
    };
    window.addEventListener("restaurant-updated", handleUpdate);
    return () => {
      window.removeEventListener("restaurant-updated", handleUpdate);
    };
  }, [activeId]);

  // Global ⌘K or Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsVenueOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (venueRef.current && !venueRef.current.contains(e.target as Node)) {
        setIsVenueOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSlug = activeFromList?.slug || restaurantSlug;

  // Same as the sidebar switcher: stay on the current sub-page in the other venue
  const handleSwitchVenue = (id: string) => {
    setIsVenueOpen(false);
    router.push(`/admin/restaurants/${id}${pathname.replace(/^\/admin\/restaurants\/[^/]+/, "") || "/dashboard"}`);
  };

  const handleSelectRoute = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <header className="glass-strong hidden lg:block mx-4 sm:mx-6 lg:mx-8 xl:mx-10 mt-3 rounded-2xl px-4 py-2.5 sticky top-3 z-30 transition-colors">
      <div className="w-full flex items-center justify-between">
        {/* Venue switcher: same list and actions as the mobile header dropdown */}
        <div ref={venueRef} className="relative min-w-0">
          <button
            type="button"
            onClick={() => setIsVenueOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={isVenueOpen}
            className="inline-flex items-center gap-2 max-w-[22rem] px-2.5 py-1.5 -ml-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition cursor-pointer"
          >
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">{currentName}</span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                isVenueOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
              }`}
            />
          </button>

          {isVenueOpen && (
            <div
              role="listbox"
              className="solid-dropdown-menu absolute left-0 mt-2 w-80 p-2 rounded-2xl space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Select Cafe or Hotel</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 text-[10px]">
                  {restaurants.length} {restaurants.length === 1 ? "venue" : "venues"}
                </span>
              </div>
              <div className="no-scrollbar max-h-72 overflow-y-auto space-y-1">
                {restaurants.map((venue) => {
                  const isCurrent = venue.id === activeId;
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => handleSwitchVenue(venue.id)}
                      className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-left transition cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-white font-bold border border-emerald-200 dark:border-emerald-800"
                          : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {venue.logoUrl ? (
                            <img src={venue.logoUrl} alt={venue.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-700 dark:text-white/80">
                              {venue.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs truncate leading-tight font-semibold">{venue.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                            {venue.address || venue.tagline || "Active Venue"}
                          </div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 dark:border-white/[0.08] pt-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsVenueOpen(false);
                    // The add-venue form lives in AdminNav; it listens for this event
                    window.dispatchEvent(new Event("open-add-venue"));
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Cafe or Hotel</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Real Search Input with Autofill Protection */}
          {/* Mouse/trackpad screens only: hidden on phones and tablets (touch), even in landscape */}
          <div ref={searchContainerRef} className="relative hidden [@media(hover:hover)_and_(pointer:fine)]:block">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                type="search"
                name="noura_quick_command_search"
                id="noura_quick_command_search"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search portal or jump to page..."
                className="w-72 sm:w-80 pl-9 pr-12 py-1.5 text-xs rounded-xl bg-slate-100/70 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-[#121927] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Quick Navigation Dropdown */}
            {isSearchOpen && (
              <div className="solid-dropdown-menu no-scrollbar absolute right-0 mt-2 w-80 max-h-96 rounded-2xl overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2.5 py-1.5">
                  {searchQuery ? "Matching Pages" : "Quick Navigation"}
                </div>
                {filteredRoutes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    No matching pages found for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredRoutes.map((route) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.href}
                          type="button"
                          onClick={() => handleSelectRoute(route.href)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/[0.06] transition group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center shrink-0 transition">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                              {route.title}
                            </div>
                            <div className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate">
                              {route.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition border border-slate-200/80 dark:border-white/[0.08] cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* View Guest Experience Button */}
          <Link
            href={`/r/${activeSlug}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-b from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-white dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-slate-200 text-white dark:text-slate-900 transition-all shadow-xs hover:shadow-md active:scale-[0.98]"
          >
            <span>View Guest Experience</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

