"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCustomerRoute = pathname?.startsWith("/r/");
  // The admin theme (light/dark glass) only governs the admin portal;
  // marketing, auth-adjacent and claim pages are designed light-only.
  const isThemedRoute = pathname?.startsWith("/admin");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Never apply admin theme to customer guest pages
    if (isCustomerRoute) return;
    if (!isThemedRoute) {
      document.documentElement.classList.remove("dark");
      return;
    }

    try {
      let stored: Theme | null = null;
      try {
        stored = localStorage.getItem("noura-theme") as Theme | null;
      } catch {}

      // Glass UI is designed dark-first; an explicit user choice always wins
      const resolved: Theme = stored ?? "dark";
      setThemeState(resolved);
      applyTheme(resolved);
    } catch {}
  }, [isCustomerRoute, isThemedRoute]);

  function applyTheme(t: Theme) {
    if (typeof window === "undefined" || !pathname?.startsWith("/admin")) return;
    try {
      const html = document.documentElement;
      if (t === "dark") {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    } catch {}
  }

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("noura-theme", t);
    } catch {}
    applyTheme(t);
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}