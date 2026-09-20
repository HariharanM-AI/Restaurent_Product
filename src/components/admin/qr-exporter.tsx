"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Radio,
  Table,
  Printer,
  ChevronRight,
  Layers,
  BarChart3,
  ExternalLink,
  UtensilsCrossed,
  Gift,
  Wifi,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";

interface QrExporterProps {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  primaryColor: string;
  tagline?: string;
}

export function QrExporter({
  restaurantId,
  restaurantSlug,
  restaurantName,
  primaryColor,
  tagline = "GOOD FOOD • BETTER COMPANY",
}: QrExporterProps) {
  const [sourceTag, setSourceTag] = useState<string>("qr");
  const [tableNumber, setTableNumber] = useState<string>("01");
  const [standSize, setStandSize] = useState<string>("Standard 4x6 Tent");
  const [fullUrl, setFullUrl] = useState<string>("");
  const [qrPngUrl, setQrPngUrl] = useState<string>("");
  const [hasCopied, setHasCopied] = useState(false);
  const [isTouchpointsModalOpen, setIsTouchpointsModalOpen] = useState(false);

  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    let url = `${origin}/r/${restaurantSlug}`;

    if (sourceTag === "table") {
      url += `?source=table-${tableNumber.trim() || "01"}`;
    } else if (sourceTag) {
      url += `?source=${sourceTag}`;
    }

    setFullUrl(url);

    // Generate crisp 600dpi QR code PNG
    QRCode.toDataURL(url, {
      width: 600,
      margin: 1.5,
      color: {
        dark: "#072C27",
        light: "#FFFFFF",
      },
    })
      .then((dataUri) => setQrPngUrl(dataUri))
      .catch(() => {});
  }, [restaurantSlug, sourceTag, tableNumber]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrPngUrl) return;
    const a = document.createElement("a");
    a.href = qrPngUrl;
    a.download = `${restaurantSlug}-qr-${sourceTag}${
      sourceTag === "table" ? `-${tableNumber}` : ""
    }-600dpi.png`;
    a.click();
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Header matching Image 3 */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2.5">
          <Link href="/admin" className="hover:text-slate-800 transition">
            Restaurants
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href={`/admin/restaurants/${restaurantId}/dashboard`}
            className="hover:text-slate-800 transition"
          >
            {restaurantName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold">QR & Touchpoints</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Physical QR & NFC Touchpoints
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F7F2] text-[#0A7E6C] border border-[#BCE8DB]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                Touchpoint Engine
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Generate and export high-resolution tabletop QR codes, acrylic tent cards, and NFC link anchors.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsTouchpointsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-xs"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>View All Touchpoints</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two Column Layout: Left Controls + Right Stand Preview */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Column: Touchpoint Configuration & Best Practices */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Card 1: Touchpoint Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#E6F7F2] text-[#0A7E6C] border border-[#BCE8DB] flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Touchpoint Configuration</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select where this QR code or NFC chip will be placed in your venue.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Placement Medium Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2.5">
                  Placement Medium
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceTag("qr")}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      sourceTag === "qr"
                        ? "bg-[#072C27] text-white border-[#072C27] shadow-md shadow-[#072C27]/10"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-bold leading-tight">General Table QR</span>
                    <span
                      className={`text-[11px] ${
                        sourceTag === "qr" ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      Standard table signage
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceTag("nfc")}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      sourceTag === "nfc"
                        ? "bg-[#072C27] text-white border-[#072C27] shadow-md shadow-[#072C27]/10"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Radio className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-bold leading-tight">NFC Chip Touch</span>
                    <span
                      className={`text-[11px] ${
                        sourceTag === "nfc" ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      Tap to connect
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceTag("table")}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      sourceTag === "table"
                        ? "bg-[#072C27] text-white border-[#072C27] shadow-md shadow-[#072C27]/10"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Table className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-bold leading-tight">Table-Specific</span>
                    <span
                      className={`text-[11px] ${
                        sourceTag === "table" ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      Unique per table
                    </span>
                  </button>
                </div>
              </div>

              {/* Table-Specific Number Input */}
              {sourceTag === "table" && (
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 animate-in fade-in-50">
                  <label
                    className="block text-xs font-bold text-slate-800"
                    htmlFor="table-number"
                  >
                    Table Number or Seating Identifier
                  </label>
                  <input
                    id="table-number"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 01, Patio-4, Bar-02"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E473F] shadow-xs"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Guests will see this table identifier tagged during their session for precise ordering and feedback.
                  </span>
                </div>
              )}

              {/* Destination Link Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Destination Link (Encoded in QR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-mono text-slate-600 select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="h-11 px-4 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition shadow-xs"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Download & Print CTAs */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!qrPngUrl}
                  className="w-full h-12 rounded-xl bg-[#072C27] hover:bg-[#0E473F] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-[#072C27]/10 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Resolution PNG (Print-Ready 600dpi)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="w-full h-11 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Acrylic Table Card Layout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Deployment Best Practices matching Image 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deployment Best Practices</h3>
                <p className="text-xs text-slate-500">
                  Recommendations for maximum guest adoption.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  1
                </div>
                <p>Place tent cards or acrylic stands angled toward eye-level at each dining table.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  2
                </div>
                <p>NFC chips should be affixed underneath waterproof tabletop laminate or wooden pucks.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  3
                </div>
                <p>Table-specific URLs allow precise loyalty tracking and feedback attribution per table.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  4
                </div>
                <p>Keep QR codes clean, well-lit, and at least 10×10 cm for easy scanning.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  5
                </div>
                <p>Test the QR code on multiple devices (iOS & Android) before deployment.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  6
                </div>
                <p>Update your touchpoints regularly with seasonal offers to drive engagement.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Acrylic Stand Mockup Preview matching Image 3 (Fixed 400px Width) */}
        <div className="w-full xl:w-[400px] shrink-0 sticky top-20 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Acrylic Stand Preview
              </span>
            </div>

            <select
              value={standSize}
              onChange={(e) => setStandSize(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0E473F]"
            >
              <option>Standard 4x6 Tent</option>
              <option>Compact 3x5 Tent</option>
              <option>Table Coaster 4x4</option>
              <option>A5 Dining Display</option>
            </select>
          </div>

          {/* Ambient Restaurant Environment Canvas */}
          <div className="w-full rounded-[32px] p-4 sm:p-6 bg-gradient-to-b from-[#e8e4df] via-[#dfd8cf] to-[#cfc5ba] border border-stone-300/80 shadow-inner flex flex-col items-center justify-center min-h-[580px] relative overflow-hidden">
            {/* Subtle background blur atmosphere elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.4),transparent_60%)] pointer-events-none" />

            {/* Acrylic Tent Stand */}
            <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-md rounded-[24px] border-2 border-white/90 shadow-2xl p-6 sm:p-7 text-center relative z-10 space-y-4">
              {/* Top Acrylic Gloss Highlight */}
              <div className="absolute -top-1 left-8 right-8 h-1 bg-white/80 rounded-full blur-[1px]" />

              {/* Restaurant Branding Header */}
              <div className="space-y-1">
                {/* Botanical leaf icon */}
                <div className="w-7 h-7 mx-auto text-[#0A7E6C]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" opacity="0" />
                    <path d="M17 3c-4.42 0-8 3.58-8 8 0 .42.04.82.11 1.21L4.59 16.73c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.52-4.52c.39.07.79.11 1.21.11 4.42 0 8-3.58 8-8V3h-2.73z" />
                  </svg>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {restaurantName}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                  {tagline}
                </p>
              </div>

              {/* Title: Scan to Connect */}
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Scan to Connect
                </h2>
                <p className="text-[11px] font-medium text-slate-600">
                  View Menu • Join Rewards • Give Feedback
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  Enjoy Free Wi-Fi • And More
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white border border-slate-200/90 rounded-2xl inline-block shadow-sm">
                {qrPngUrl ? (
                  <img
                    src={qrPngUrl}
                    alt="Touchpoint QR code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-300">
                    <QrCode className="w-10 h-10 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Action Chips Row under QR */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">Menu</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">Rewards</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                    <Wifi className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">Wi-Fi</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">Feedback</span>
                </div>
              </div>

              {/* Botanical Calligraphy Illustration matching image */}
              <div className="pt-2 border-t border-slate-100 flex flex-col items-center">
                <p
                  className="font-serif italic text-base text-slate-700 tracking-wide"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Good Food
                </p>
                <p
                  className="font-serif italic text-sm text-slate-600 -mt-1 tracking-wide"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Brings People Together
                </p>
                {/* Botanical leaves flourish */}
                <div className="w-10 h-4 mt-1 text-[#0A7E6C]/60">
                  <svg viewBox="0 0 100 24" fill="currentColor" className="w-full h-full">
                    <path d="M50,12 C40,4 20,6 10,12 C20,18 40,20 50,12 Z" opacity="0.6" />
                    <path d="M50,12 C60,4 80,6 90,12 C80,18 60,20 50,12 Z" opacity="0.6" />
                    <line x1="5" y1="12" x2="95" y2="12" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Acrylic Base Reflection & Foot */}
            <div className="w-48 h-2.5 bg-white/40 rounded-full blur-[2px] mt-1 shadow-lg" />
          </div>

          {/* Bottom Card: Track Performance matching Image 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Track Performance</h4>
                <p className="text-[11px] text-slate-500">
                  View scans, engagement, and conversions in Analytics.
                </p>
              </div>
            </div>

            <Link
              href={`/admin/restaurants/${restaurantId}/analytics`}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0A7E6C] hover:text-[#072C27] transition shrink-0"
            >
              <span>Go to Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: View All Touchpoints */}
      {isTouchpointsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Venue Touchpoints Directory</h3>
                <p className="text-xs text-slate-500">
                  Manage all active QR and NFC links deployed across {restaurantName}.
                </p>
              </div>
              <button
                onClick={() => setIsTouchpointsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E6F7F2] text-[#0A7E6C] flex items-center justify-center font-bold text-xs">
                    QR
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">General Venue QR Stand</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      /r/{restaurantSlug}?source=qr
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSourceTag("qr");
                    setIsTouchpointsModalOpen(false);
                  }}
                  className="text-xs font-bold text-[#0A7E6C] hover:underline"
                >
                  Configure
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    NFC
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Tabletop NFC Tap Anchor</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      /r/{restaurantSlug}?source=nfc
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSourceTag("nfc");
                    setIsTouchpointsModalOpen(false);
                  }}
                  className="text-xs font-bold text-[#0A7E6C] hover:underline"
                >
                  Configure
                </button>
              </div>

              {["01", "02", "03", "04", "05"].map((num) => (
                <div
                  key={num}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                      T{num}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Dining Table #{num}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        /r/{restaurantSlug}?source=table-{num}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceTag("table");
                      setTableNumber(num);
                      setIsTouchpointsModalOpen(false);
                    }}
                    className="text-xs font-bold text-[#0A7E6C] hover:underline"
                  >
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
