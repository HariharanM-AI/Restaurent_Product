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
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Never apply admin theme to customer guest pages
    if (isCustomerRoute) return;

    try {
      let stored: Theme | null = null;
      try {
        stored = localStorage.getItem("noura-theme") as Theme | null;
      } catch {}

      const prefersDark =
        typeof window !== "undefined" && typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-color-scheme: dark)")?.matches
          : false;

      const resolved: Theme = stored ?? (prefersDark ? "dark" : "light");
      setThemeState(resolved);
      applyTheme(resolved);
    } catch {}
  }, [isCustomerRoute]);

  function applyTheme(t: Theme) {
    if (typeof window === "undefined" || pathname?.startsWith("/r/")) return;
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