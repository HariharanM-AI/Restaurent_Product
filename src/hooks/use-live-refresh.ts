"use client";

import { useCallback, useEffect, useRef } from "react";
import { subscribeToActivity } from "@/lib/realtime/broadcast";

/**
 * Keeps a view fresh without hammering the API:
 *  - polls every `intervalMs` (default 30s)
 *  - never starts a refresh while one is still in flight
 *  - pauses while the tab is hidden, and refreshes once when it becomes visible
 *  - also refreshes on same-browser realtime activity events (same in-flight guard)
 */
export function useLiveRefresh(
  restaurantId: string,
  refresh: () => Promise<unknown> | unknown,
  intervalMs = 30_000
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const inFlight = useRef(false);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    if (typeof document !== "undefined" && document.hidden) return;
    inFlight.current = true;
    try {
      await refreshRef.current();
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToActivity(restaurantId, () => {
      void run();
    });
    const timer = setInterval(() => {
      void run();
    }, intervalMs);
    const onVisibility = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [restaurantId, intervalMs, run]);
}
