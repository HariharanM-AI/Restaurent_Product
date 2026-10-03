"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import {
  Wifi,
  Check,
  Eye,
  EyeOff,
  Copy,
  ShieldCheck,
  Smartphone,
  Sparkles,
  QrCode,
  ArrowRight,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { WifiConfigData } from "@/types";

interface WifiAdminFormProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
  initialConfig: WifiConfigData | null;
}

export function WifiAdminForm({ restaurant, initialConfig }: WifiAdminFormProps) {
  const [ssid, setSsid] = useState(initialConfig?.ssid || "");
  const [password, setPassword] = useState(initialConfig?.password || "");
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? true);
  const [instructions, setInstructions] = useState(
    initialConfig?.instructions || ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreviewPassword, setShowPreviewPassword] = useState(false);
  const [wifiQrUrl, setWifiQrUrl] = useState<string>("");

  // Generate standard Wi-Fi quick-connect QR in real-time
  useEffect(() => {
    if (!ssid.trim()) {
      setWifiQrUrl("");
      return;
    }
    const wifiString = `WIFI:T:${password ? "WPA" : "nopass"};S:${ssid};P:${password};;`;
    QRCode.toDataURL(wifiString, {
      width: 320,
      margin: 1,
      color: {
        dark: "#072C27",
        light: "#FFFFFF",
      },
    })
      .then((url) => setWifiQrUrl(url))
      .catch(() => {});
  }, [ssid, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/wifi`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ssid,
          password: password || "",
          enabled,
          instructions: instructions || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsError(false);
        setStatusMessage("Wi-Fi network configuration updated successfully.");
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setIsError(true);
        setStatusMessage(json.error?.message || "Failed to update Wi-Fi configuration.");
      }
    } catch {
      setIsError(true);
      setStatusMessage("An unexpected network error occurred while updating Wi-Fi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSsid(initialConfig?.ssid || "");
    setPassword(initialConfig?.password || "");
    setEnabled(initialConfig?.enabled ?? true);
    setInstructions(initialConfig?.instructions || "");
    setStatusMessage(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs & Status (Exact Match to Image 1) */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <span>Restaurants</span>
          <span>/</span>
          <span>{restaurant.name}</span>
          <span>/</span>
          <span className="text-slate-600">Wi-Fi</span>
        </div>
        <div className="mt-1">
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Guest Wi-Fi Configuration
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure guest wireless credentials, connection instructions, auto-join QR, and display status.
        </p>
      </div>

      {/* 2. Main Form Layout */}
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="space-y-6">
          {/* Card: Guest Network Credentials */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Guest Network Credentials
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Broadcast SSID and access passkey for in-venue dining guests.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active in Guest Hub
              </span>
            </div>

            {statusMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  isError
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                }`}
              >
                {isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Network Name (SSID) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Network Name (SSID) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder={`e.g. ${restaurant.name.replace(/\s+/g, "_")}_Guest`}
                    className="w-full pl-4 pr-10 py-3 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-semibold"
                  />
                  <Wifi className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Network Passkey / Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter network password"
                    className="w-full pl-4 pr-10 py-3 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank if your guest Wi-Fi operates without a security password.
                </p>
              </div>

              {/* Instructions / Terms */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Connection Instructions or Terms
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {instructions.length}/300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={`Connect to ${ssid || restaurant.name + " Wi-Fi"}. Fast, complimentary access for all dining guests.`}
                  className="w-full px-4 py-3 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 leading-relaxed resize-none"
                />
              </div>

              {/* Security Alert Banner */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">
                    This network will be visible to guests on your mobile landing hub.
                  </span>{" "}
                  Keep the connection simple and secure. Avoid using sensitive internal networks.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#0B3B36] hover:bg-[#072B26] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save Wi-Fi Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Card: Enhance Guest Engagement */}
          <div className="p-5 rounded-[20px] bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  Enhance Guest Engagement
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Combine Wi-Fi with loyalty, feedback, and special offers to turn first-time guests into regulars.
                </p>
              </div>
            </div>
            <Link
              href={`/admin/restaurants/${restaurant.id}/actions`}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition shadow-2xs"
            >
              <span>Explore Guest Actions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
