"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/tracker";

interface GuestHubTrackerProps {
  restaurantId: string;
}

export function GuestHubTracker({ restaurantId }: GuestHubTrackerProps) {
  useEffect(() => {
    trackEvent({
      restaurantId,
      eventType: "guest_page_view",
    });
  }, [restaurantId]);

  return null;
}
