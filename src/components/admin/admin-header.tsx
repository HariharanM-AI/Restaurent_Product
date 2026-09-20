"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface AdminHeaderProps {
  restaurantName: string;
  restaurantSlug: string;
  userName?: string | null;
}

export function AdminHeader({ restaurantName, restaurantSlug, userName }: AdminHeaderProps) {
  return (
    <header className="hidden lg:block px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Venue
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-extrabold text-slate-800">
            {restaurantName}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
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

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs cursor-pointer shadow-2xs transition">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-left">
              <div className="font-extrabold text-[11px] text-slate-800 leading-tight">Last 30 days</div>
              <div className="text-[10px] text-slate-400">Mar 1, 2025 – Mar 31, 2025</div>
            </div>
            <svg className="w-3 h-3 text-slate-400 ml-1 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>

          {/* Notifications Bell */}
          <button className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {/* User Avatar Circle */}
          <div className="w-8 h-8 rounded-full bg-[#111111] text-white font-extrabold text-xs flex items-center justify-center border border-white/20 shadow-xs">
            {userName ? userName[0].toUpperCase() : "A"}
          </div>

          {/* View Guest Experience Button */}
          <Link
            href={`/r/${restaurantSlug}`}
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
