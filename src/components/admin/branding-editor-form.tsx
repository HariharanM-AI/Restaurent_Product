"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RestaurantData, GuestActionData, SocialLinkData } from "@/types";
import { SaaSCard } from "@/components/ui/saas-card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Palette,
  MapPin,
  Phone,
  Globe,
  Image as ImageIcon,
  Smartphone,
  ExternalLink,
  Wifi,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  UploadCloud,
  Trash2,
  RefreshCw,
  Loader2,
  UtensilsCrossed,
  Star,
  MessageSquarePlus,
  Gamepad2,
  Share2,
  AlertCircle,
} from "lucide-react";

interface BrandingEditorFormProps {
  restaurant: RestaurantData;
  actions?: GuestActionData[];
  initialSocialLinks?: SocialLinkData[];
}

const PRESET_COLORS = [
  { label: "Teal Modern", hex: "#0F766E" },
  { label: "Emerald Fresh", hex: "#059669" },
  { label: "Indigo Luxury", hex: "#4F46E5" },
  { label: "Amber Bistro", hex: "#D97706" },
  { label: "Rose Artisan", hex: "#E11D48" },
  { label: "Slate Midnight", hex: "#334155" },
  { label: "Violet Vibrant", hex: "#7C3AED" },
  { label: "Orange Crisp", hex: "#EA580C" },
];

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function getActionIcon(iconName: string) {
  switch (iconName?.toLowerCase()) {
    case "award":
      return <Award className="w-4 h-4" />;
    case "star":
      return <Star className="w-4 h-4" />;
    case "utensilscrossed":
    case "utensils":
      return <UtensilsCrossed className="w-4 h-4" />;
    case "wifi":
      return <Wifi className="w-4 h-4" />;
    case "messagesquareplus":
    case "messagesquare":
      return <MessageSquarePlus className="w-4 h-4" />;
    case "gamepad2":
    case "gamepad":
      return <Gamepad2 className="w-4 h-4" />;
    default:
      return <Share2 className="w-4 h-4" />;
  }
}

export function BrandingEditorForm({
  restaurant,
  actions = [],
  initialSocialLinks = [],
}: BrandingEditorFormProps) {
  const router = useRouter();
  const [name, setName] = useState(restaurant.name || "");
  const [tagline, setTagline] = useState(restaurant.tagline || "");
  const [primaryColor, setPrimaryColor] = useState(restaurant.primaryColor || "#0F766E");
  const [secondaryColor, setSecondaryColor] = useState(restaurant.secondaryColor || "#F8FAFC");
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl || "");
  const [coverImageUrl, setCoverImageUrl] = useState(restaurant.coverImageUrl || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(restaurant.googleMapsUrl || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [website, setWebsite] = useState(restaurant.website || "");
  const [openingHours, setOpeningHours] = useState(restaurant.openingHours || "");

  const existingInsta = initialSocialLinks.find((s) => s.platform === "INSTAGRAM")?.url || "";
  const existingFb = initialSocialLinks.find((s) => s.platform === "FACEBOOK")?.url || "";
  const [instagramUrl, setInstagramUrl] = useState(existingInsta);
  const [facebookUrl, setFacebookUrl] = useState(existingFb);

  // Upload States
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  // Preview Drawer State
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);

  // Form Submit States
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Handle Logo File Upload
  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLogoUploadError("File size exceeds 10MB limit.");
      return;
    }

    setLogoUploadError(null);
    setIsUploadingLogo(true);

    // Instant local preview for zero-latency reactive mobile preview
    const objectUrl = URL.createObjectURL(file);
    setLogoUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", restaurant.id);
      formData.append("category", "logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLogoUrl(json.data.url);
        window.dispatchEvent(
          new CustomEvent("restaurant-updated", {
            detail: { id: restaurant.id, name, logoUrl: json.data.url },
          })
        );
      } else {
        setLogoUploadError(json.error?.message || "Failed to upload logo.");
      }
    } catch {
      setLogoUploadError("Network error occurred during logo upload.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Cover Banner File Upload
  const handleCoverUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverUploadError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setCoverUploadError("File size exceeds 25MB limit.");
      return;
    }

    setCoverUploadError(null);
    setIsUploadingCover(true);

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setCoverImageUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", restaurant.id);
      formData.append("category", "covers");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCoverImageUrl(json.data.url);
      } else {
        setCoverUploadError(json.error?.message || "Failed to upload cover banner.");
      }
    } catch {
      setCoverUploadError("Network error occurred during banner upload.");
    } finally {
      setIsUploadingCover(false);
    }
  };

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
          googleMapsUrl: googleMapsUrl || null,
          phone: phone || null,
          website: website || null,
          openingHours: openingHours || null,
          instagramUrl: instagramUrl || null,
          facebookUrl: facebookUrl || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage("Brand identity and styling synchronized successfully.");
        setTimeout(() => setSuccessMessage(null), 4000);
        window.dispatchEvent(
          new CustomEvent("restaurant-updated", {
            detail: { id: restaurant.id, name: name, logoUrl: logoUrl },
          })
        );
        router.refresh();
      } else {
        setErrorMessage(json.error?.message || "Failed to update branding settings.");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Build live guest action list for preview
  const displayActions = actions.length > 0 ? actions : [
    {
      id: "preview-rewards",
      restaurantId: restaurant.id,
      type: "REWARDS",
      title: "Start Earning Rewards",
      description: "Collect digital stamps with every checkout for complimentary rewards",
      icon: "Award",
      url: `/r/${restaurant.slug}/rewards`,
      enabled: true,
      displayOrder: 1,
      badge: "Loyalty",
      metadata: null,
    },
    {
      id: "preview-review",
      restaurantId: restaurant.id,
      type: "REVIEW",
      title: "Leave a Google Review",
      description: "Share your culinary experience with the community",
      icon: "Star",
      url: "https://maps.google.com",
      enabled: true,
      displayOrder: 2,
      badge: "Feedback",
      metadata: null,
    },
    {
      id: "preview-menu",
      restaurantId: restaurant.id,
      type: "MENU",
      title: "View Menu",
      description: "Explore seasonal farm-to-table lunch, dinner, and cocktails",
      icon: "UtensilsCrossed",
      url: `/r/${restaurant.slug}/menu`,
      enabled: true,
      displayOrder: 3,
      badge: "Spring 2026",
      metadata: null,
    },
    {
      id: "preview-wifi",
      restaurantId: restaurant.id,
      type: "WIFI",
      title: "Connect to Wi-Fi",
      description: "High-speed complimentary wireless internet for guests",
      icon: "Wifi",
      url: `/r/${restaurant.slug}/wifi`,
      enabled: true,
      displayOrder: 4,
      badge: null,
      metadata: null,
    },
    {
      id: "preview-feedback",
      restaurantId: restaurant.id,
      type: "FEEDBACK",
      title: "Leave Anonymous Feedback",
      description: "Send direct, private feedback to our executive chef and managers",
      icon: "MessageSquarePlus",
      url: `/r/${restaurant.slug}/feedback`,
      enabled: true,
      displayOrder: 5,
      badge: null,
      metadata: null,
    },
    {
      id: "preview-game",
      restaurantId: restaurant.id,
      type: "GAME",
      title: "Play Sudoku",
      description: "Enjoy a relaxing classic puzzle while waiting for your course",
      icon: "Gamepad2",
      url: `/r/${restaurant.slug}/game`,
      enabled: true,
      displayOrder: 6,
      badge: null,
      metadata: null,
    },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      {/* Form Column */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity & Display Name */}
          <SaaSCard
            title="General Identity"
            subtitle="Display name and culinary concept tagline displayed across the guest hub."
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
                  onChange={(e) => {
                    setName(e.target.value);
                    window.dispatchEvent(
                      new CustomEvent("restaurant-updated", {
                        detail: { id: restaurant.id, name: e.target.value, logoUrl: logoUrl },
                      })
                    );
                  }}
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
                  placeholder="e.g. Locally sourced rustic kitchen & craft cocktail lounge"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
              </div>
            </div>
          </SaaSCard>

          {/* Visual Media Assets (File Upload Fields) */}
          <SaaSCard
            title="Visual Media Assets"
            subtitle="Upload restaurant logo and header cover photography. Updates reflect in real-time."
          >
            <div className="space-y-6 pt-2">
              {/* Logo Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restaurant Logo</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Square 1:1 recommended, PNG, JPG, SVG, WebP up to 10MB
                  </span>
                </label>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />

                {logoUrl ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                        <img src={logoUrl} alt="Restaurant Logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          Current Logo Asset
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Applied across guest experience & digital receipts
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                        icon={isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      >
                        {isUploadingLogo ? "Uploading..." : "Replace"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isUploadingLogo
                        ? "border-teal-400 bg-teal-50/40"
                        : "border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                        <span className="text-xs font-semibold text-teal-800">Uploading logo image...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Click to upload logo or drag and drop
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            PNG, JPG, SVG or WebP (max 10MB)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {logoUploadError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{logoUploadError}</p>
                )}
              </div>

              {/* Cover Banner Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cover Banner Photography</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Landscape 16:9 recommended, PNG, JPG, WebP up to 25MB
                  </span>
                </label>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                  }}
                />

                {coverImageUrl ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="w-full h-32 rounded-xl bg-slate-200 overflow-hidden relative border border-slate-200 shadow-xs">
                      <img
                        src={coverImageUrl}
                        alt="Restaurant Cover Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Header photography active on guest hub
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isUploadingCover}
                          onClick={() => coverInputRef.current?.click()}
                          icon={isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        >
                          {isUploadingCover ? "Uploading..." : "Replace Banner"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setCoverImageUrl("")}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Remove Cover Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleCoverUpload(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isUploadingCover
                        ? "border-teal-400 bg-teal-50/40"
                        : "border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    {isUploadingCover ? (
                      <>
                        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                        <span className="text-xs font-semibold text-teal-800">Uploading banner image...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Click to upload cover banner or drag and drop
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            High-resolution 16:9 photo (max 25MB)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {coverUploadError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{coverUploadError}</p>
                )}
              </div>
            </div>
          </SaaSCard>

          {/* Color Palette & Themes */}
          <SaaSCard
            title="Brand Color Palette"
            subtitle="Applied dynamically to buttons, stamp progress cards, badges, and QR headers."
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
                      className="w-11 h-11 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shadow-xs"
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
                    className="h-11 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold text-white shadow-xs"
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
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
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

          {/* Contact & Physical Address */}
          <SaaSCard
            title="Contact & Physical Location"
            subtitle="Physical venue details and operating schedule displayed in the guest information drawer."
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-map">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Google Maps Location URL</span>
                </label>
                <input
                  id="rest-map"
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=428+Market+Street+San+Francisco"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  
                </span>
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
                    placeholder="e.g. (555) 234-8901"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-hours">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Opening Hours / Operating Schedule</span>
                </label>
                <input
                  id="rest-hours"
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="e.g. Open Today: 11:30 AM – 10:00 PM or Mon–Sun 11:30 AM – 10:00 PM"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  
                </span>
              </div>
            </div>
          </SaaSCard>

          {/* Social Media Presence (Individual Instagram & Facebook fields) */}
          <SaaSCard
            title="Social Media Profiles"
            subtitle="Dedicated links to your official social channels shown in the guest hub footer."
          >
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-instagram">
                  <InstagramIcon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Instagram Profile URL</span>
                </label>
                <input
                  id="rest-instagram"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourrestaurant"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" htmlFor="rest-facebook">
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Facebook Page URL</span>
                </label>
                <input
                  id="rest-facebook"
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourrestaurant"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  
                </span>
              </div>
            </div>
          </SaaSCard>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-6 pb-16">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 hover:from-teal-600 hover:via-teal-500 hover:to-emerald-600 text-white font-extrabold text-sm px-10 py-3.5 rounded-xl shadow-lg shadow-teal-900/25 hover:shadow-xl hover:shadow-teal-900/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 border border-teal-400/30 cursor-pointer"
              icon={<Check className="w-4 h-4 text-white stroke-[2.5]" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Real Mobile Preview Column (Updates in Real-Time) */}
      <div className="w-full xl:w-[380px] shrink-0 sticky top-20">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Live Guest Preview
            </span>
          </div>
          <a
            href={`/r/${restaurant.slug}?preview=true`}
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
          <div className="bg-slate-50 rounded-[30px] overflow-hidden border border-slate-200/80 shadow-inner flex flex-col h-[640px]">
            {/* Phone Status Bar */}
            <div className="h-6 bg-slate-950 px-5 flex items-center justify-between text-[10px] font-semibold text-slate-300 shrink-0">
              <span>9:41</span>
              <div className="w-16 h-3 bg-black rounded-full mx-auto -mt-0.5" />
              <div className="flex items-center gap-1 text-[9px]">
                <Wifi className="w-2.5 h-2.5" />
                <span>5G</span>
              </div>
            </div>

            {/* Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div>
                {/* Real-time Header Banner */}
                <div
                  className="h-32 w-full relative transition-all duration-300 shrink-0 bg-slate-800"
                  style={{
                    background: coverImageUrl
                      ? `url(${coverImageUrl}) center/cover`
                      : `linear-gradient(135deg, ${primaryColor} 0%, #0F172A 100%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-semibold text-white">
                      Guest View
                    </span>
                  </div>
                </div>

                {/* Profile & Identity Block */}
                <div className="relative px-4 pb-3 bg-white border-b border-slate-100">
                  <div className="-mt-10 mb-2 flex items-end justify-between">
                    <div className="relative w-20 h-20 rounded-2xl bg-white p-1 shadow-md border-2 border-white overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-xl flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {(name || "R").charAt(0)}
                        </div>
                      )}
                    </div>

                    {(address || phone || website || openingHours) && (
                      <button
                        type="button"
                        onClick={() => setIsPreviewDrawerOpen(!isPreviewDrawerOpen)}
                        className="mb-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
                      >
                        <span>{isPreviewDrawerOpen ? "Hide" : "Details"}</span>
                        {isPreviewDrawerOpen ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {name || "Restaurant Name"}
                  </h3>
                  {tagline && (
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                      {tagline}
                    </p>
                  )}

                  {/* Collapsible Info Drawer */}
                  {isPreviewDrawerOpen && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                      {address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          {googleMapsUrl ? (
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-700 hover:underline truncate"
                            >
                              {address}
                            </a>
                          ) : (
                            <span className="truncate">{address}</span>
                          )}
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      )}
                      {website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{website.replace(/^https?:\/\//, "")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{openingHours || "Open Today: 11:30 AM – 10:00 PM"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions Header */}
                <div className="px-4 pt-3 pb-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Quick Actions
                  </h4>
                </div>

                {/* Real Actions List */}
                <div className="px-4 space-y-2 py-1">
                  {displayActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between transition hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {getActionIcon(action.icon)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {action.title}
                            </span>
                            {action.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                {action.badge}
                              </span>
                            )}
                          </div>
                          {action.description && (
                            <span className="text-[10px] text-slate-500 block truncate">
                              {action.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-Time Social Footer */}
              <div className="py-4 px-4 text-center mt-3 border-t border-slate-100 bg-white">
                {(instagramUrl || facebookUrl || website) && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Connect With Us
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                      {instagramUrl && (
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-rose-600 shadow-xs">
                          <InstagramIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {facebookUrl && (
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs">
                          <FacebookIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {website && (
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
                  <span>Powered by</span>
                  <span className="font-semibold text-slate-600">Noura</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
