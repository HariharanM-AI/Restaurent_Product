"use client";

import { useState, useEffect, useCallback } from "react";
import { LoyaltyWalletData } from "@/types";

let inMemoryBrowserId: string | null = null;

// The wallet ID is the guest's only credential, so 128 bits from the browser's crypto RNG.
// getRandomValues rather than randomUUID: randomUUID is missing on plain-http pages (e.g. LAN testing).
const randomWalletId = (prefix: string) =>
  prefix + Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

function getOrCreateBrowserId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";

  try {
    let id = localStorage.getItem("guestlink_loyalty_browser_id");
    if (!id) {
      id = randomWalletId("wal_");
      localStorage.setItem("guestlink_loyalty_browser_id", id);
    }
    return id;
  } catch {
    if (!inMemoryBrowserId) {
      inMemoryBrowserId = randomWalletId("wal_mem_");
    }
    return inMemoryBrowserId;
  }
}

export function useLoyaltyWallet(restaurantId: string | null) {
  const [browserId, setBrowserId] = useState<string>("");
  const [wallet, setWallet] = useState<LoyaltyWalletData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBrowserId(getOrCreateBrowserId());
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!restaurantId || !browserId) return;

    // isLoading starts true and only covers the first load, so background refreshes don't flash the card
    setError(null);

    try {
      const res = await fetch(
        `/api/loyalty/wallet?restaurantId=${encodeURIComponent(
          restaurantId
        )}&browserId=${encodeURIComponent(browserId)}`
      );

      const json = await res.json();
      if (res.ok && json.success) {
        setWallet(json.data);
      } else {
        setError(json.error?.message || "Failed to load loyalty wallet.");
      }
    } catch {
      setError("Network error loading loyalty wallet.");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, browserId]);

  useEffect(() => {
    if (restaurantId && browserId) {
      fetchWallet();
    }
  }, [restaurantId, browserId, fetchWallet]);

  return {
    browserId,
    wallet,
    isLoading,
    error,
    refetch: fetchWallet,
  };
}
