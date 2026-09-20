"use client";

import React, { useState } from "react";
import { RestaurantData } from "@/types";
import { SaaSCard } from "@/components/ui/saas-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Check,
  Palette,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  Image as ImageIcon,
  Smartphone,
  ExternalLink,
  Wifi,
  Award,
  MessageSquare,
  Utensils,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface BrandingEditorFormProps {
  restaurant: RestaurantData;
}

const PRESET_COLORS = [
  { label: "Teal Modern", hex: "#0F766E", ring: "ring-teal-500" },
  { label: "Emerald Fresh", hex: "#059669", ring: "ring-emerald-500" },
  { label: "Indigo Luxury", hex: "#4F46E5", ring: "ring-indigo-500" },
  { label: "Amber Bistro", hex: "#D97706", ring: "ring-amber-500" },
  { label: "Rose Artisan", hex: "#E11D48", ring: "ring-rose-500" },
  { label: "Slate Midnight", hex: "#334155", ring: "ring-slate-500" },
  { label: "Violet Vibrant", hex: "#7C3AED", ring: "ring-violet-500" },
  { label: "Orange Crisp", hex: "#EA580C", ring: "ring-orange-500" },
];

export function BrandingEditorForm({ restaurant }: BrandingEditorFormProps) {
  const [name, setName] = useState(restaurant.name);
  const [tagline, setTagline] = useState(restaurant.tagline || "");
  const [primaryColor, setPrimaryColor] = useState(restaurant.primaryColor || "#0F766E");
  const [secondaryColor, setSecondaryColor] = useState(restaurant.secondaryColor || "#F8FAFC");
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl || "");
  const [coverImageUrl, setCoverImageUrl] = useState(restaurant.coverImageUrl || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [website, setWebsite] = useState(restaurant.website || "");

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline: tagline || null,
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || null,
          coverImageUrl: coverImageUrl || null,
          address: address || null,
          phone: phone || null,
          website: website || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage("Brand identity and styling synchronized successfully.");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.error?.message || "Failed to update branding settings.");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      {/* Form Column */}
      <div className="flex-1 min-w-0 space-y-6">
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-2.5 animate-in fade-in-50">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl animate-in fade-in-50">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity & Typography */}
          <SaaSCard
            title="General Identity"
            subtitle="Display name and dining concept tagline shown on the guest landing hub"
          >
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="rest-name">
                  Restaurant Legal or Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="rest-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="rest-tagline">
                  Concept Tagline / Subtitle
                </label>
                <input
                  id="rest-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Artisanal wood-fired sourdough & natural wines"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
              </div>
            </div>
          </SaaSCard>

          {/* Color Palette & Themes */}
          <SaaSCard
            title="Brand Color Palette"
            subtitle="Applied dynamically to buttons, stamp cards, badges, and QR headers"
          >
            <div className="space-y-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-teal-600" />
                  <span>Primary Accent Color</span>
                </label>

                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <input
                      type="color"
                      aria-label="Color Picker"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-11 h-11 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shadow-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    placeholder="#0F766E"
                    className="w-32 h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                  <div
                    className="h-11 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>Preview Accent</span>
                  </div>
                </div>

                {/* Preset Swatches */}
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Curated Palettes
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = primaryColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setPrimaryColor(c.hex)}
                          className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.label}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </SaaSCard>

          {/* Imagery & Media */}
          <SaaSCard
            title="Visual Media Assets"
            subtitle="Direct CDN links or image URLs for logos and hero photography"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-logo">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Logo URL</span>
                </label>
                <input
                  id="rest-logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Square 1:1 format recommended</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-cover">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cover Banner URL</span>
                </label>
                <input
                  id="rest-cover"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">16:9 landscape banner header</span>
              </div>
            </div>
          </SaaSCard>

          {/* Contact & Physical Address */}
          <SaaSCard
            title="Contact & Location"
            subtitle="Physical venue details displayed in guest footer and receipt summaries"
          >
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-address">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Physical Venue Address</span>
                </label>
                <input
                  id="rest-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 428 Market Street, Suite 100, San Francisco, CA"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-phone">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Contact Phone</span>
                  </label>
                  <input
                    id="rest-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (415) 555-0192"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-website">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Official Website</span>
                  </label>
                  <input
                    id="rest-website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.yourrestaurant.com"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </SaaSCard>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={<Check className="w-4 h-4" />}
            >
              Save Branding Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Column */}
      <div className="w-full xl:w-[380px] shrink-0 sticky top-20">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Guest Preview
            </span>
          </div>
          <a
            href={`/r/${restaurant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>Open live page</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Smartphone Shell Frame */}
        <div className="w-full bg-slate-900 p-3 rounded-[38px] shadow-2xl ring-1 ring-slate-800">
          {/* Bezel inner */}
          <div className="bg-white rounded-[30px] overflow-hidden border border-slate-200/80 shadow-inner flex flex-col min-h-[580px]">
            {/* Phone Status Bar */}
            <div className="h-6 bg-slate-950 px-5 flex items-center justify-between text-[10px] font-semibold text-slate-300">
              <span>9:41</span>
              <div className="w-16 h-3.5 bg-black rounded-full mx-auto -mt-1" />
              <div className="flex items-center gap-1 text-[9px]">
                <Wifi className="w-2.5 h-2.5" />
                <span>5G</span>
              </div>
            </div>

            {/* Header Banner Preview */}
            <div
              className="h-28 w-full relative transition-all duration-300"
              style={{
                background: coverImageUrl
                  ? `url(${coverImageUrl}) center/cover`
                  : `linear-gradient(135deg, ${primaryColor} 0%, #0F172A 100%)`,
              }}
            >
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-semibold text-white">
                  Table 04
                </span>
              </div>
            </div>

            {/* Logo & Info Block */}
            <div className="p-4 pt-0 flex-1 flex flex-col justify-between">
              <div>
                <div className="-mt-8 mb-2.5 flex items-end justify-between">
                  <div
                    className="w-16 h-16 rounded-2xl border-2 border-white bg-white shadow-md flex items-center justify-center text-white font-bold text-xl overflow-hidden transition-all"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0)
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                    Verified Hub
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-tight truncate">
                  {name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {tagline || "Artisan dining & culinary craft"}
                </p>

                {/* Mock Actions List */}
                <div className="mt-4 space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">Digital Dining Menu</span>
                        <span className="text-[10px] text-slate-400 block">Seasonal plates & drink pairings</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">High-Speed Wi-Fi</span>
                        <span className="text-[10px] text-slate-400 block">One-tap guest connection</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">VIP Stamp Loyalty</span>
                      <span className="text-[10px] text-slate-400 block">Collect stamps for complimentary dining</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Footer */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-[9px] font-medium text-slate-400">
                  Powered by GuestLink SaaS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
