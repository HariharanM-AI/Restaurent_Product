/**
 * Client-side anonymous telemetry event dispatcher.
 * Collects non-PII metrics to evaluate guest engagement.
 */

function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "server-ssr";

  let sessionId = sessionStorage.getItem("guestlink_anon_session_id");
  if (!sessionId) {
    sessionId = "anon_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    sessionStorage.setItem("guestlink_anon_session_id", sessionId);
  }
  return sessionId;
}

function getDeviceCategory(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "mobile";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function trackEvent(params: {
  restaurantId: string;
  eventType: string;
  actionId?: string;
  source?: "qr" | "nfc" | "direct" | "campaign";
  metadata?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;

  const payload = {
    restaurantId: params.restaurantId,
    eventType: params.eventType,
    actionId: params.actionId,
    anonymousSessionId: getAnonymousSessionId(),
    deviceCategory: getDeviceCategory(),
    referrer: document.referrer || null,
    source: params.source || "direct",
    metadata: params.metadata || null,
  };

  try {
    const url = "/api/analytics/events";
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Telemetry errors fail silently without disturbing the user
      });
    }
  } catch {
    // Fail silently
  }
}
