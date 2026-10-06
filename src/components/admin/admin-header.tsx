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
  Sparkles,
  Wifi,
  QrCode,
  BarChart3,
  Store,
  Users,
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

  const searchRoutes = [
    { title: "Dashboard", href: `/admin/restaurants/${activeId}/dashboard`, icon: LayoutDashboard, desc: "Key metrics & guest interactions" },
    { title: "Menu Manager", href: `/admin/restaurants/${activeId}/menu`, icon: UtensilsCrossed, desc: "Digital & PDF menu catalog" },
    { title: "Loyalty & Stamps", href: `/admin/restaurants/${activeId}/loyalty`, icon: Award, desc: "Digital stamps & rewards" },
    { title: "Guest Feedback", href: `/admin/restaurants/${activeId}/feedback`, icon: MessageSquare, desc: "Reviews, ratings & suggestions" },
    { title: "Guest Actions", href: `/admin/restaurants/${activeId}/actions`, icon: Sparkles, desc: "Interactive cards on guest hub" },
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSlug = activeFromList?.slug || restaurantSlug;

  const handleSelectRoute = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <header className="hidden lg:block px-4 sm:px-6 lg:px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-2xs">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Venue
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            {currentName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Real Search Input with Autofill Protection */}
          <div ref={searchContainerRef} className="relative">
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
                className="w-72 pl-8 pr-12 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Quick Navigation Dropdown */}
            {isSearchOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150 p-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 py-1.5">
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center shrink-0 transition">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
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
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition border border-slate-200/80 dark:border-slate-700"
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
            className="inline-flex items-center gap-2 text-xs font-extrabold px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-[#222222] dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition shadow-sm"
          >
            <span>View Guest Experience</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

