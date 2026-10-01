"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/tracker";

interface GuestHubTrackerProps {
  restaurantId: string;
}

export function GuestHubTracker({ restaurantId }: GuestHubTrackerProps) {
  useEffect(() => {
    // Ensure the customer sees from the very top of the page with full cover banner
    if (typeof window !== "undefined") {
      try {
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration = "manual";
        }
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;

        // Re-enforce on next animation frame after initial layout pass
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
        });
      } catch {
        // Safe fallback for restricted webviews
      }
    }

    trackEvent({
      restaurantId,
      eventType: "guest_page_view",
    });
  }, [restaurantId]);

  return null;
}
