"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Wifi, Copy, Check, Eye, EyeOff, Lock, Info, QrCode as QrIcon } from "lucide-react";
import { generateWifiPayload } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/tracker";

interface WifiData {
  ssid: string;
  password?: string;
  enabled: boolean;
  instructions?: string | null;
}

export default function WifiPage() {
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("Restaurant");
  const [brandColor, setBrandColor] = useState<string>("var(--brand-primary, #0F766E)");
  const [wifiData, setWifiData] = useState<WifiData | null>(null);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/restaurants/by-slug/${slug}`)
      .then((res) => res.json())
      .then(async (json) => {
        if (json.success && json.data) {
          const rest = json.data.restaurant;
          const wifi = json.data.wifi;

          setRestaurantId(rest.id);
          setRestaurantName(rest.name);
          setBrandColor(rest.primaryColor || "var(--brand-primary, #0F766E)");
          setWifiData(wifi);

          if (wifi && wifi.enabled && wifi.ssid) {
            const payload = generateWifiPayload(wifi.ssid, wifi.password);
            try {
              const url = await QRCode.toDataURL(payload, {
                width: 256,
                margin: 2,
                color: {
                  dark: "#0F172A",
                  light: "#FFFFFF",
                },
              });
              setQrDataUrl(url);
            } catch {
              // Ignore QR rendering failure
            }
          }

          // Track wifi open
          trackEvent({
            restaurantId: rest.id,
            eventType: "wifi_open",
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleCopyPassword = () => {
    if (!wifiData?.password) return;
    navigator.clipboard.writeText(wifiData.password);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);

    if (restaurantId) {
      trackEvent({
        restaurantId,
        eventType: "wifi_copy",
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/r/${slug}`}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">
          {restaurantName}
        </span>
        <div className="w-8" />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              <Wifi className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Guest Wi-Fi Access</h2>
            <p className="text-xs text-slate-500 mt-1">
              Complimentary high-speed wireless internet
            </p>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading connection details...</div>
          ) : !wifiData || !wifiData.enabled ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-600">
                Wi-Fi access is currently not configured or disabled by the restaurant.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Network SSID Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Network Name (SSID)
                </span>
                <span className="text-sm font-semibold text-slate-900 block font-mono">
                  {wifiData.ssid}
                </span>
              </div>

              {/* Password Card with Copy & Reveal */}
              {wifiData.password && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Password
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 font-mono select-all">
                      {showPassword ? wifiData.password : "••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
                        title={showPassword ? "Hide password" : "Reveal password"}
                        aria-label={showPassword ? "Hide password" : "Reveal password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleCopyPassword}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          hasCopied
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                        }`}
                      >
                        {hasCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {wifiData.instructions && (
                <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/50 text-xs text-teal-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-teal-800">
                    {wifiData.instructions}
                  </p>
                </div>
              )}

              {/* Wi-Fi Join QR Code (Scan to join) */}
              {qrDataUrl && (
                <div className="pt-4 border-t border-slate-100 text-center">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                    <QrIcon className="w-4 h-4 text-slate-500" />
                    <span>Scan with Camera to Connect</span>
                  </div>
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <img src={qrDataUrl} alt="Wi-Fi Connection QR" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    Point your smartphone camera to connect instantly
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <Link
              href={`/r/${slug}`}
              className="block w-full text-center py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Return to Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
