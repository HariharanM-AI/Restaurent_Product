"use client";

import { useState, useEffect, useCallback } from "react";
import { LoyaltyWalletData } from "@/types";

let inMemoryBrowserId: string | null = null;

function getOrCreateBrowserId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";

  try {
    let id = localStorage.getItem("guestlink_loyalty_browser_id");
    if (!id) {
      id = "wal_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      localStorage.setItem("guestlink_loyalty_browser_id", id);
    }
    return id;
  } catch {
    if (!inMemoryBrowserId) {
      inMemoryBrowserId = "wal_mem_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
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

    setIsLoading(true);
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
