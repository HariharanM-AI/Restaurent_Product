"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Phone, Globe, ChevronDown, ChevronUp, Clock, Sparkles } from "lucide-react";
import { RestaurantData } from "@/types";

interface RestaurantHeaderProps {
  restaurant: RestaurantData;
}

export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="relative w-full bg-white/95 dark:bg-[#0B0F17]/95 border-b border-slate-200/70 dark:border-white/[0.08] shadow-card transition-colors">
      {/* Cover Banner with Cinematic Depth */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900">
        {restaurant.coverImageUrl ? (
          <img
            src={restaurant.coverImageUrl}
            alt={`${restaurant.name} cover`}
            className="w-full h-full object-cover object-center scale-[1.02] transform motion-safe:transition-transform motion-safe:duration-700"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(ellipse at top right, ${restaurant.primaryColor || "#0F766E"}44 0%, #0B0F17 100%)`,
            }}
          />
        )}
        {/* Cinematic multi-stop gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      </div>

      {/* Profile & Identity */}
      <div className="relative px-5 pt-0 pb-5">
        {/* Overlapping Logo & Action Pill */}
        <div className="-mt-14 mb-3.5 flex items-end justify-between gap-3">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#131B2B] p-1 shadow-luxury ring-1 ring-black/[0.06] dark:ring-white/[0.12] overflow-hidden flex items-center justify-center shrink-0">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-inner"
                style={{ backgroundColor: restaurant.primaryColor || "#0F766E" }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Quick Info Drawer Toggle Button */}
          {(restaurant.address || restaurant.phone || restaurant.website || restaurant.openingHours) && (
            <button
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className="mb-1 text-xs font-bold px-3.5 py-2 rounded-full glass-pill hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer border border-slate-200/60 dark:border-white/[0.1]"
              aria-expanded={isInfoExpanded}
            >
              <span>{isInfoExpanded ? "Close Info" : "Venue & Hours"}</span>
              {isInfoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Title & Tagline with Refined Typography */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {restaurant.name}
        </h1>
        {restaurant.tagline && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-normal max-w-xl">
            {restaurant.tagline}
          </p>
        )}

        {/* Collapsible Info Drawer - Elevated Glass Container */}
        {isInfoExpanded && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50/90 dark:bg-[#131B2B]/90 border border-slate-200/70 dark:border-white/[0.08] space-y-2.5 text-xs text-slate-600 dark:text-slate-300 shadow-xs animate-in fade-in-50 slide-in-from-top-2 duration-200">
            {restaurant.address && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                {restaurant.googleMapsUrl ? (
                  <a
                    href={restaurant.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-2 transition-colors font-medium"
                  >
                    {restaurant.address}
                  </a>
                ) : (
                  <span className="font-medium">{restaurant.address}</span>
                )}
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <a
                  href={`tel:${restaurant.phone}`}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-2 transition-colors font-medium"
                >
                  {restaurant.phone}
                </a>
              </div>
            )}
            {restaurant.website && (
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors truncate font-medium"
                >
                  {restaurant.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 pt-0.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium">{restaurant.openingHours || "Open Today: 11:30 AM – 10:00 PM"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
