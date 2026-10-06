"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Phone, Globe, ChevronDown, ChevronUp, Clock } from "lucide-react";
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
    <div className="relative w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
      {/* Cover Banner with Gradient Overlay */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-800">
        {restaurant.coverImageUrl ? (
          <img
            src={restaurant.coverImageUrl}
            alt={`${restaurant.name} cover`}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${restaurant.primaryColor} 0%, #0F172A 100%)`,
            }}
          />
        )}
        {/* Soft dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Profile & Identity */}
      <div className="relative px-5 pt-0 pb-4">
        {/* Overlapping Logo */}
        <div className="-mt-14 mb-3 flex items-end justify-between">
          <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-0.5 shadow-md border-2 border-white dark:border-slate-800 overflow-hidden flex items-center justify-center">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: restaurant.primaryColor }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Quick Info Drawer Toggle Button */}
          {(restaurant.address || restaurant.phone || restaurant.website || restaurant.openingHours) && (
            <button
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className="mb-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
              aria-expanded={isInfoExpanded}
            >
              <span>{isInfoExpanded ? "Hide Details" : "Location & Hours"}</span>
              {isInfoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Title & Tagline */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          {restaurant.name}
        </h1>
        {restaurant.tagline && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-normal font-normal">
            {restaurant.tagline}
          </p>
        )}

        {/* Collapsible Info Drawer */}
        {isInfoExpanded && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in-50 duration-200">
            {restaurant.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                {restaurant.googleMapsUrl ? (
                  <a
                    href={restaurant.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary underline"
                  >
                    {restaurant.address}
                  </a>
                ) : (
                  <span>{restaurant.address}</span>
                )}
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={`tel:${restaurant.phone}`} className="hover:text-primary underline">
                  {restaurant.phone}
                </a>
              </div>
            )}
            {restaurant.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline truncate"
                >
                  {restaurant.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{restaurant.openingHours || "Open Today: 11:30 AM – 10:00 PM"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
