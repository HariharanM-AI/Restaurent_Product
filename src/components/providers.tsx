"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/theme-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

/* Feeds pointer position to `.spotlight` glass cards (--mx / --my) with one listener */
function SpotlightTracker() {
  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = (e.target as Element | null)?.closest?.(".spotlight") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SpotlightTracker />
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
