"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

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
  const match = pathname.match(/\/admin\/restaurants\/([^/]+)/);
  const activeId = match ? match[1] : null;
  const activeFromList = restaurants.find((r) => r.id === activeId);

  const initialName = activeFromList?.name || restaurantName;
  const [currentName, setCurrentName] = useState(initialName);

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

  const activeSlug = activeFromList?.slug || restaurantSlug;

  return (
    <header className="hidden lg:block px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Venue
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-extrabold text-slate-800">
            {currentName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search guests, feedback, or anything..."
              className="w-64 pl-8 pr-10 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </div>

          {/* View Guest Experience Button */}
          <Link
            href={`/r/${activeSlug}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-extrabold px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-[#222222] text-white transition shadow-sm"
          >
            <span>View Guest Experience</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
