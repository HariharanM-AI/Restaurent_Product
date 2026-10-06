"use client";

import React, { useEffect, useState } from "react";
import { subscribeToActivity } from "@/lib/realtime/broadcast";

interface CustomerThemeSyncProps {
  restaurantId: string;
  slug: string;
  initialThemeMode: "light" | "dark";
  initialPrimaryColor: string;
  initialSecondaryColor: string;
  children: React.ReactNode;
}

export function CustomerThemeSync({
  restaurantId,
  slug,
  initialThemeMode = "light",
  initialPrimaryColor = "#0F766E",
  initialSecondaryColor = "#F8FAFC",
  children,
}: CustomerThemeSyncProps) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">(initialThemeMode || "light");
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || "#0F766E");
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor || "#F8FAFC");

  // Keep in sync with server props if page revalidates
  useEffect(() => {
    if (initialThemeMode) setThemeMode(initialThemeMode);
  }, [initialThemeMode]);

  useEffect(() => {
    if (initialPrimaryColor) setPrimaryColor(initialPrimaryColor);
  }, [initialPrimaryColor]);

  useEffect(() => {
    // Check localStorage cache for instant updates across tabs
    try {
      const cached = localStorage.getItem(`noura-theme-${slug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
      }
    } catch {}

    // Real-time broadcast channel subscription
    const unsubscribe = subscribeToActivity(restaurantId, (event) => {
      if (event.eventType === "theme_updated" && event.payload) {
        if (event.payload.themeMode) {
          setThemeMode(event.payload.themeMode);
        }
        if (event.payload.primaryColor) {
          setPrimaryColor(event.payload.primaryColor);
        }
        if (event.payload.secondaryColor) {
          setSecondaryColor(event.payload.secondaryColor);
        }
      }
    });

    // In-window custom event handler
    const handleCustomEvent = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail && (ce.detail.restaurantId === restaurantId || ce.detail.slug === slug)) {
        if (ce.detail.themeMode) setThemeMode(ce.detail.themeMode);
        if (ce.detail.primaryColor) setPrimaryColor(ce.detail.primaryColor);
        if (ce.detail.secondaryColor) setSecondaryColor(ce.detail.secondaryColor);
      }
    };
    window.addEventListener("customer-theme-updated", handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener("customer-theme-updated", handleCustomEvent);
    };
  }, [restaurantId, slug]);

  // Synchronize document.documentElement classes for Tailwind dark: variants
  useEffect(() => {
    const html = document.documentElement;
    if (themeMode === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }

    // Set CSS variable
    html.style.setProperty("--primary", primaryColor);
    html.style.setProperty("--brand-primary", primaryColor);
    html.style.setProperty("--brand-secondary", secondaryColor);
  }, [themeMode, primaryColor, secondaryColor]);

  const isDark = themeMode === "dark";

  return (
    <div
      className={`${isDark ? "dark" : ""} min-h-screen flex flex-col justify-start transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
      style={
        {
          "--primary": primaryColor,
          "--brand-primary": primaryColor,
          "--brand-secondary": secondaryColor,
        } as React.CSSProperties
      }
    >
      <div
        className={`w-full max-w-md mx-auto min-h-screen shadow-2xl flex flex-col transition-colors duration-300 ${
          isDark
            ? "bg-slate-900 border-x border-slate-800 text-slate-100"
            : "bg-white border-x border-slate-200/60 text-slate-900"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
