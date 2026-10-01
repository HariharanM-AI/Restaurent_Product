/**
 * Real-time inter-tab and in-app event dispatcher for Noura.
 * Connects the live guest experience with all admin dashboards, analytics, and CRM pages.
 */

export interface RealtimeActivityEvent {
  restaurantId: string;
  eventType: string;
  timestamp: number;
  payload?: any;
}

const CHANNEL_NAME = "noura_realtime_channel";

let channel: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }
  return channel;
}

/**
 * Broadcast an activity event to all active admin tabs and windows in real-time.
 */
export function broadcastActivity(restaurantId: string, eventType: string, payload?: any) {
  if (typeof window === "undefined") return;

  const eventData: RealtimeActivityEvent = {
    restaurantId,
    eventType,
    timestamp: Date.now(),
    payload,
  };

  // 1. Dispatch custom event in current window/iframe
  try {
    window.dispatchEvent(
      new CustomEvent("noura-activity", {
        detail: eventData,
      })
    );
  } catch {}

  // 2. Broadcast across tabs via BroadcastChannel
  try {
    const ch = getBroadcastChannel();
    if (ch) {
      ch.postMessage(eventData);
    }
  } catch {}

  // 3. Fallback broadcast via localStorage (triggers 'storage' event in other tabs)
  try {
    localStorage.setItem(
      "noura_last_activity",
      JSON.stringify(eventData)
    );
  } catch {}
}

/**
 * Subscribe to real-time activity for a specific restaurant.
 * Triggered whenever a guest views, clicks, submits feedback, or interacts.
 */
export function subscribeToActivity(
  restaurantId: string,
  onActivity: (event: RealtimeActivityEvent) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  // Handler for BroadcastChannel
  const handleBroadcastMessage = (e: MessageEvent) => {
    const data = e.data as RealtimeActivityEvent;
    if (data && (!data.restaurantId || data.restaurantId === restaurantId)) {
      onActivity(data);
    }
  };

  // Handler for in-window custom events
  const handleCustomEvent = (e: Event) => {
    const ce = e as CustomEvent<RealtimeActivityEvent>;
    if (ce.detail && (!ce.detail.restaurantId || ce.detail.restaurantId === restaurantId)) {
      onActivity(ce.detail);
    }
  };

  // Handler for cross-tab storage fallback
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === "noura_last_activity" && e.newValue) {
      try {
        const data = JSON.parse(e.newValue) as RealtimeActivityEvent;
        if (data && (!data.restaurantId || data.restaurantId === restaurantId)) {
          onActivity(data);
        }
      } catch {}
    }
  };

  const ch = getBroadcastChannel();
  if (ch) {
    ch.addEventListener("message", handleBroadcastMessage);
  }
  window.addEventListener("noura-activity", handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    if (ch) {
      ch.removeEventListener("message", handleBroadcastMessage);
    }
    window.removeEventListener("noura-activity", handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
