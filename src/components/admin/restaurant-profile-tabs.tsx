"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RestaurantData, GuestActionData, SocialLinkData } from "@/types";
import { SaaSCard } from "@/components/ui/saas-card";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import {
  Check,
  Palette,
  MapPin,
  Phone,
  Globe,
  Clock,
  UploadCloud,
  Loader2,
  AlertCircle,
  Lock,
  Shield,
  Sun,
  Moon,
  Store,
  ExternalLink,
  Camera,
  BadgeCheck,
  User,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { broadcastActivity } from "@/lib/realtime/broadcast";

interface RestaurantProfileTabsProps {
  restaurant: RestaurantData;
  actions?: GuestActionData[];
  initialSocialLinks?: SocialLinkData[];
  adminUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const ACCENT_PRESETS = [
  {
    id: "violet",
    name: "Violet",
    hex: "#7C3AED",
    desc: "The default — confident, slightly playful.",
  },
  {
    id: "emerald",
    name: "Emerald",
    hex: "#059669",
    desc: "Growth-coded, nods at messaging without copying WhatsApp green.",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    hex: "#2563EB",
    desc: "Clean B2B-SaaS blue — calm and product-y.",
  },
  {
    id: "amber",
    name: "Amber",
    hex: "#D97706",
    desc: "Warm and friendly — feels good for SMB teams.",
  },
  {
    id: "rose",
    name: "Rose",
    hex: "#E11D48",
    desc: "Bold and modern — D2C, creator-economy, lifestyle.",
  },
  {
    id: "teal",
    name: "Teal Modern",
    hex: "#0F766E",
    desc: "Organic fresh & culinary — balanced signature aesthetic.",
  },
  {
    id: "slate",
    name: "Midnight Slate",
    hex: "#334155",
    desc: "Understated elegance — fine dining and boutique lounges.",
  },
  {
    id: "orange",
    name: "Orange Crisp",
    hex: "#EA580C",
    desc: "Vibrant and appetizing — high-energy bistro & cafe style.",
  },
];

const TABS = [
  { id: "profile", label: "Profile", icon: Store },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Login & Security", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ─── Custom Colored Brand SVGs ─── */
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

function FieldLabel({
  icon: Icon,
  label,
  hint,
  required,
  iconClassName = "text-slate-500 dark:text-slate-400",
}: {
  icon?: React.ElementType;
  label: string;
  hint?: string;
  required?: boolean;
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 mb-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClassName}`} />}
        <span>{label}</span>
        {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      {hint && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal leading-normal">
          {hint}
        </span>
      )}
    </div>
  );
}

function AlertBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
        type === "success"
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
          : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
      }`}
    >
      {type === "success" ? <BadgeCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />}
      {message}
    </motion.div>
  );
}

export function RestaurantProfileTabs({
  restaurant,
  actions = [],
  initialSocialLinks = [],
  adminUser,
}: RestaurantProfileTabsProps) {
  const router = useRouter();
  const [customerThemeMode, setCustomerThemeMode] = useState<"light" | "dark">(
    (restaurant.themeMode as "light" | "dark") || "light"
  );
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const [name, setName] = useState(restaurant.name || "");
  const [tagline, setTagline] = useState(restaurant.tagline || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(restaurant.googleMapsUrl || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [website, setWebsite] = useState(restaurant.website || "");
  const [openingHours, setOpeningHours] = useState(restaurant.openingHours || "");
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl || "");
  const [coverImageUrl, setCoverImageUrl] = useState(restaurant.coverImageUrl || "");
  const existingInsta = initialSocialLinks.find((s) => s.platform === "INSTAGRAM")?.url || "";
  const existingFb = initialSocialLinks.find((s) => s.platform === "FACEBOOK")?.url || "";
  const [instagramUrl, setInstagramUrl] = useState(existingInsta);
  const [facebookUrl, setFacebookUrl] = useState(existingFb);
  const [primaryColor, setPrimaryColor] = useState(restaurant.primaryColor || "#0F766E");
  const [secondaryColor, setSecondaryColor] = useState(restaurant.secondaryColor || "#F8FAFC");

  // Admin Profile Photo State
  const [adminPhotoUrl, setAdminPhotoUrl] = useState<string | null>(adminUser?.image || null);
  const [isUploadingAdminPhoto, setIsUploadingAdminPhoto] = useState(false);
  const [adminPhotoError, setAdminPhotoError] = useState<string | null>(null);
  const adminPhotoInputRef = useRef<HTMLInputElement>(null);

  // Password & Security State (Zero autofill, strict manual entry)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active Sessions & Sign out of all devices state
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);
  const [signOutAllError, setSignOutAllError] = useState<string | null>(null);

  const adminInitials = (adminUser?.name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminPhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAdminPhotoError("Invalid image file. Please upload PNG, JPG, or WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAdminPhotoError("File size exceeds 10MB limit.");
      return;
    }
    setAdminPhotoError(null);
    setIsUploadingAdminPhoto(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("restaurantId", restaurant.id);
      fd.append("category", "general");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (res.ok && json.success) {
        const uploadedUrl = json.data.url;
        setAdminPhotoUrl(uploadedUrl);

        // Update admin user profile in database
        const profileRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: uploadedUrl }),
        });

        if (profileRes.ok) {
          setSuccessMessage("Admin profile photo updated successfully.");
          setTimeout(() => setSuccessMessage(null), 4000);

          // Dispatch event so sidebar & header immediately show the new photo
          window.dispatchEvent(
            new CustomEvent("admin-profile-updated", {
              detail: { image: uploadedUrl },
            })
          );
        } else {
          setAdminPhotoError("Photo uploaded, but could not link to profile.");
        }
      } else {
        setAdminPhotoError(json.error?.message || "Upload failed. Please try again.");
      }
    } catch {
      setAdminPhotoError("Network connection error.");
    } finally {
      setIsUploadingAdminPhoto(false);
    }
  };

  const handleRemoveAdminPhoto = async () => {
    setIsUploadingAdminPhoto(true);
    setAdminPhotoError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });
      if (res.ok) {
        setAdminPhotoUrl(null);
        setSuccessMessage("Admin profile photo removed.");
        setTimeout(() => setSuccessMessage(null), 4000);
        window.dispatchEvent(
          new CustomEvent("admin-profile-updated", {
            detail: { image: null },
          })
        );
      } else {
        setAdminPhotoError("Failed to remove profile photo.");
      }
    } catch {
      setAdminPhotoError("Network error. Please try again.");
    } finally {
      setIsUploadingAdminPhoto(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPasswordSuccess("Password updated successfully! You will stay signed in on this device.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(json.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Network connection error. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out on all devices? This will invalidate all active sessions including this browser."
    );
    if (!confirmed) return;

    setIsSigningOutAll(true);
    setSignOutAllError(null);
    try {
      const res = await fetch("/api/auth/signout-all", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        await signOut({ callbackUrl: "/login" });
      } else {
        setSignOutAllError(json.error || "Failed to terminate all sessions.");
        setIsSigningOutAll(false);
      }
    } catch {
      setSignOutAllError("Network error while terminating sessions.");
      setIsSigningOutAll(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Invalid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLogoUploadError("File exceeds 10MB limit.");
      return;
    }
    setLogoUploadError(null);
    setIsUploadingLogo(true);
    setLogoUrl(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("restaurantId", restaurant.id);
      fd.append("category", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.success) {
        setLogoUrl(json.data.url);
        window.dispatchEvent(
          new CustomEvent("restaurant-updated", {
            detail: { id: restaurant.id, name, logoUrl: json.data.url },
          })
        );
      } else {
        setLogoUploadError(json.error?.message || "Upload failed.");
      }
    } catch {
      setLogoUploadError("Network connection error.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setCoverUploadError("Invalid image file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setCoverUploadError("File exceeds 25MB limit.");
      return;
    }
    setCoverUploadError(null);
    setIsUploadingCover(true);
    setCoverImageUrl(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("restaurantId", restaurant.id);
      fd.append("category", "covers");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.success) {
        setCoverImageUrl(json.data.url);
      } else {
        setCoverUploadError(json.error?.message || "Upload failed.");
      }
    } catch {
      setCoverUploadError("Network connection error.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
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
          themeMode: customerThemeMode,
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
        setSuccessMessage("Appearance & profile updated successfully.");
        setTimeout(() => setSuccessMessage(null), 4000);

        // Immediate broadcast to any live customer guest tabs
        broadcastActivity(restaurant.id, "theme_updated", {
          themeMode: customerThemeMode,
          primaryColor,
          secondaryColor,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(
            `noura-theme-${restaurant.slug}`,
            JSON.stringify({
              themeMode: customerThemeMode,
              primaryColor,
              timestamp: Date.now(),
            })
          );
          window.dispatchEvent(
            new CustomEvent("customer-theme-updated", {
              detail: {
                restaurantId: restaurant.id,
                slug: restaurant.slug,
                themeMode: customerThemeMode,
                primaryColor,
              },
            })
          );
          window.dispatchEvent(
            new CustomEvent("restaurant-updated", {
              detail: { id: restaurant.id, name, logoUrl },
            })
          );
        }
        router.refresh();
      } else {
        setErrorMessage(json.error?.message || "Failed to update profile.");
      }
    } catch {
      setErrorMessage("Network connection error.");
    } finally {
      setIsSaving(false);
    }
  };

  const SaveButton = () => (
    <div className="flex justify-end pt-2 pb-10">
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-[#0A7E6C] hover:bg-[#076254] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-teal-900/20 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {isSaving ? "Saving Changes..." : "Save Changes"}
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Tab Navigation Bar */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.span
                  layoutId="tabUnderline"
                  className="absolute inset-0 rounded-xl ring-1 ring-teal-400/30 dark:ring-teal-500/40"
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {successMessage && (
          <div className="mb-4">
            <AlertBanner type="success" message={successMessage} />
          </div>
        )}
        {errorMessage && (
          <div className="mb-4">
            <AlertBanner type="error" message={errorMessage} />
          </div>
        )}
        {logoUploadError && (
          <div className="mb-4">
            <AlertBanner type="error" message={logoUploadError} />
          </div>
        )}
        {coverUploadError && (
          <div className="mb-4">
            <AlertBanner type="error" message={coverUploadError} />
          </div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Profile (Updated to Previous Style with Rich SaaSCards & Colored Icons) */}
        {activeTab === "profile" && (
          <motion.form
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSave}
            className="space-y-6"
          >
            {/* 1. General Identity */}
            <SaaSCard
              title="General Identity"
              subtitle="Display name and culinary concept tagline displayed across the guest hub."
            >
              <div className="space-y-4 pt-2">
                <div>
                  <FieldLabel label="Restaurant Legal or Display Name" required />
                  <input
                    id="rest-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      window.dispatchEvent(
                        new CustomEvent("restaurant-updated", {
                          detail: { id: restaurant.id, name: e.target.value, logoUrl },
                        })
                      );
                    }}
                    placeholder="e.g. Hari Cafe Final"
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>

                <div>
                  <FieldLabel label="Concept Tagline / Subtitle" hint="Optional" />
                  <input
                    id="rest-tagline"
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Locally sourced rustic kitchen & craft cocktail lounge"
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>

                {/* Admin Profile Photo Upload (Appears as admin profile image) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <FieldLabel icon={User} label="Admin Profile Photo" hint="Appears as admin avatar across dashboard" />
                  <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-1">
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 w-full sm:w-auto">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-emerald-500/40 shadow-xs flex items-center justify-center overflow-hidden">
                          {adminPhotoUrl ? (
                            <img src={adminPhotoUrl} alt="Admin Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-sm sm:text-base flex items-center justify-center">
                              {adminInitials}
                            </div>
                          )}
                        </div>
                        {isUploadingAdminPhoto && (
                          <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {adminUser?.name || "Admin Account Photo"}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-snug mt-0.5">
                          PNG, JPG, or WebP up to 10MB
                        </span>
                        {adminPhotoError && (
                          <span className="text-xs text-red-600 dark:text-red-400 block mt-1 font-medium leading-tight">
                            {adminPhotoError}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                      <input
                        ref={adminPhotoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAdminPhotoUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUploadingAdminPhoto}
                        onClick={() => adminPhotoInputRef.current?.click()}
                        className="flex-1 sm:flex-initial justify-center dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 cursor-pointer text-xs"
                        icon={
                          isUploadingAdminPhoto ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {isUploadingAdminPhoto
                          ? "Uploading..."
                          : adminPhotoUrl
                          ? "Change Photo"
                          : "Upload Photo"}
                      </Button>
                      {adminPhotoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isUploadingAdminPhoto}
                          onClick={handleRemoveAdminPhoto}
                          className="flex-1 sm:flex-initial justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer text-xs"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SaaSCard>

            {/* 2. Visual Media Assets (File Upload Fields matching previous style) */}
            <SaaSCard
              title="Visual Media Assets"
              subtitle="Upload restaurant logo and header cover photography. Updates reflect in real-time."
            >
              <div className="space-y-6 pt-2">
                {/* Logo Upload Zone */}
                <div>
                  <FieldLabel
                    icon={ImageIcon}
                    label="Restaurant Logo"
                    hint="Square 1:1 recommended, PNG, JPG, SVG, WebP up to 10MB"
                  />

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
                    <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                          <img src={logoUrl} alt="Restaurant Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                            Current Logo Asset
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-snug mt-0.5">
                            Applied across guest experience & digital receipts
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-1 sm:pt-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isUploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                          className="flex-1 sm:flex-initial justify-center dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 cursor-pointer text-xs"
                          icon={
                            isUploadingLogo ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {isUploadingLogo ? "Uploading..." : "Replace"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
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
                          ? "border-teal-400 bg-teal-50/40 dark:bg-teal-950/20"
                          : "border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
                      }`}
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                          <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                            Uploading logo image...
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              Click to upload logo or drag and drop
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              PNG, JPG, SVG or WebP (max 10MB)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {logoUploadError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">{logoUploadError}</p>
                  )}
                </div>

                {/* Cover Banner Upload Zone */}
                <div>
                  <FieldLabel
                    icon={ImageIcon}
                    label="Cover Banner Photography"
                    hint="Landscape 16:9 recommended, PNG, JPG, WebP up to 25MB"
                  />

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
                    <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                      <div className="w-full h-32 sm:h-36 rounded-xl bg-slate-200 dark:bg-slate-900 overflow-hidden relative border border-slate-200 dark:border-slate-700 shadow-xs">
                        <img
                          src={coverImageUrl}
                          alt="Restaurant Cover Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Header photography active on guest hub
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isUploadingCover}
                            onClick={() => coverInputRef.current?.click()}
                            className="flex-1 sm:flex-initial justify-center dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 cursor-pointer text-xs"
                            icon={
                              isUploadingCover ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )
                            }
                          >
                            {isUploadingCover ? "Uploading..." : "Replace Banner"}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setCoverImageUrl("")}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
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
                          ? "border-teal-400 bg-teal-50/40 dark:bg-teal-950/20"
                          : "border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
                      }`}
                    >
                      {isUploadingCover ? (
                        <>
                          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                          <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                            Uploading banner image...
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              Click to upload cover banner or drag and drop
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              High-resolution 16:9 photo (max 25MB)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {coverUploadError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">{coverUploadError}</p>
                  )}
                </div>
              </div>
            </SaaSCard>

            {/* 3. Contact & Physical Location (Previous Style with Coloured Icons) */}
            <SaaSCard
              title="Contact & Physical Location"
              subtitle="Physical venue details and operating schedule displayed in the guest information drawer."
            >
              <div className="space-y-4 pt-2">
                <div>
                  <FieldLabel
                    icon={MapPin}
                    label="Physical Venue Address"
                    iconClassName="text-slate-500 dark:text-slate-400"
                  />
                  <input
                    id="rest-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Coimbatore, Tamilnadu"
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>

                <div>
                  <FieldLabel
                    icon={MapPin}
                    label="Google Maps Location URL"
                    iconClassName="text-teal-600 dark:text-teal-400"
                  />
                  <input
                    id="rest-map"
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      icon={Phone}
                      label="Contact Phone"
                      iconClassName="text-slate-500 dark:text-slate-400"
                    />
                    <input
                      id="rest-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 7339527453"
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      icon={Globe}
                      label="Official Website"
                      iconClassName="text-slate-500 dark:text-slate-400"
                    />
                    <input
                      id="rest-website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://Hari_Cafe.com"
                      className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel
                    icon={Clock}
                    label="Opening Hours / Operating Schedule"
                    iconClassName="text-amber-600 dark:text-amber-400"
                  />
                  <input
                    id="rest-hours"
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="Mon-Sun: 11:30 AM - 11:00 PM"
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>
              </div>
            </SaaSCard>

            {/* 4. Social Media Profiles (With Previous Colored Instagram & Facebook Icons) */}
            <SaaSCard
              title="Social Media Profiles"
              subtitle="Dedicated links to your official social channels shown in the guest hub footer."
            >
              <div className="space-y-4 pt-2">
                <div>
                  <FieldLabel
                    icon={InstagramIcon}
                    label="Instagram Profile URL"
                    iconClassName="text-rose-600 dark:text-rose-400"
                  />
                  <input
                    id="rest-instagram"
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/Hari_Cafe"
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>

                <div>
                  <FieldLabel
                    icon={FacebookIcon}
                    label="Facebook Page URL"
                    iconClassName="text-blue-600 dark:text-blue-400"
                  />
                  <input
                    id="rest-facebook"
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/Hari_Cafe"
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                  />
                </div>
              </div>
            </SaaSCard>

            <SaveButton />
          </motion.form>
        )}

        {/* Tab 2: Appearance (Redesigned matching images 2 & 3, dedicated strictly to customer guest hub) */}
        {activeTab === "appearance" && (
          <motion.form
            key="appearance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSave}
            className="space-y-7"
          >
            {/* Section Header */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Appearance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Set the mode and accent colour used across the customer guest experience. Saved and reflected live for your dining guests.
              </p>
            </div>

            {/* Mode Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sun className="w-4 h-4 text-slate-400" />
                <span>Mode</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => setCustomerThemeMode("light")}
                  className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                    customerThemeMode === "light"
                      ? "border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Light
                    </span>
                  </div>
                  {customerThemeMode === "light" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  )}
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => setCustomerThemeMode("dark")}
                  className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                    customerThemeMode === "dark"
                      ? "border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Dark
                    </span>
                  </div>
                  {customerThemeMode === "dark" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Accent Color Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Palette className="w-4 h-4 text-slate-400" />
                <span>Accent color</span>
              </div>

              <div className="space-y-3">
                {ACCENT_PRESETS.map((preset) => {
                  const isActive = primaryColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPrimaryColor(preset.hex)}
                      className={`w-full relative flex flex-col p-4 sm:p-5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isActive
                          ? "border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-50/15 dark:bg-emerald-950/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Top Row: Color swatch circle & Active badge */}
                      <div className="flex items-center justify-between w-full mb-2.5">
                        <div
                          className="w-8 h-8 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: preset.hex }}
                        />
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3 stroke-[3]" /> Active
                          </span>
                        )}
                      </div>

                      {/* Name & Subtitle */}
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {preset.desc}
                        </p>
                      </div>

                      {/* Horizontal preview progress bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3.5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: "88%",
                            backgroundColor: preset.hex,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}

                {/* Custom Hex Color Card */}
                {(() => {
                  const isCustomActive = !ACCENT_PRESETS.some(
                    (p) => p.hex.toLowerCase() === primaryColor.toLowerCase()
                  );
                  return (
                    <div
                      className={`w-full relative flex flex-col p-4 sm:p-5 rounded-2xl border transition-all text-left ${
                        isCustomActive
                          ? "border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-50/15 dark:bg-emerald-950/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2.5">
                        <div
                          className="w-8 h-8 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        />
                        {isCustomActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3 stroke-[3]" /> Active
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 mb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Custom Hex Accent
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Specify any custom brand color with live hex code or color picker.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1">
                        <input
                          type="color"
                          aria-label="Custom color picker"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={primaryColor.toUpperCase()}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setPrimaryColor(v);
                          }}
                          className="w-32 h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          maxLength={7}
                        />
                        <div
                          className="h-9 px-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-white shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Preview
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3.5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: "88%",
                            backgroundColor: primaryColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <SaveButton />
          </motion.form>
        )}

        {/* Tab 3: Login & Security (Kept intact with clean styles and dark mode support) */}
        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SaaSCard
              title="Account Information"
              subtitle="Your restaurant portal credentials and account details."
            >
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/60 mt-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                  {adminPhotoUrl ? (
                    <img src={adminPhotoUrl} alt="Admin Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{restaurant.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Restaurant Client Account • Slug: {restaurant.slug}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Active
                  </span>
                </div>
              </div>
            </SaaSCard>

            {/* Password & Security Card - Strict Manual Entry without Autofill */}
            <SaaSCard
              title="Password & Security"
              subtitle="Use at least 8 characters. You will stay signed in on this device after changing it."
            >
              <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                {/* Dummy hidden input to deter browser autofill */}
                <input
                  type="password"
                  name="prevent_browser_autofill_dummy"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {passwordSuccess && (
                  <AlertBanner type="success" message={passwordSuccess} />
                )}
                {passwordError && (
                  <AlertBanner type="error" message={passwordError} />
                )}

                {/* Current Password Field - Empty by default, admin must manually enter */}
                <div>
                  <FieldLabel icon={Lock} label="Current Password" required />
                  <div className="relative">
                    <input
                      id="current-password-manual-input"
                      name="security_current_password_manual"
                      type={showCurrentPass ? "text" : "password"}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full h-11 pl-3.5 pr-10 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showCurrentPass ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <FieldLabel icon={KeyRound} label="New Password" hint="Minimum 8 characters" required />
                  <div className="relative">
                    <input
                      id="new-password-field"
                      name="security_new_password"
                      type={showNewPass ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 pl-3.5 pr-10 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showNewPass ? "Hide new password" : "Show new password"}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <FieldLabel icon={KeyRound} label="Confirm New Password" required />
                  <div className="relative">
                    <input
                      id="confirm-password-field"
                      name="security_confirm_password"
                      type={showConfirmPass ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full h-11 pl-3.5 pr-10 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:focus:bg-slate-800 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showConfirmPass ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl mt-3">
                  <div className="flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Password updates are authenticated and logged. Updating your credentials will keep your restaurant portal safe.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm transition shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </SaaSCard>

            {/* Active Sessions Card - Matching 3rd Image Page */}
            <SaaSCard
              title="Active Sessions"
              subtitle="Devices and browsers currently authenticated to this restaurant account."
            >
              <div className="space-y-4 pt-2">
                {signOutAllError && (
                  <AlertBanner type="error" message={signOutAllError} />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Current Active Session</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This browser • Active right now</div>
                  </div>
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                    Connected
                  </span>
                </div>

                {/* Whatbro-style Active Sessions Sign-Out Card matching Image 3 */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Sign Out on All Devices
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Sign out of every device where you&apos;re logged in — including this one. Useful if you lost a laptop or shared your password.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isSigningOutAll}
                      onClick={handleSignOutAllDevices}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:border-red-800 dark:hover:text-red-300 text-slate-800 dark:text-slate-200 font-semibold text-xs transition shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      {isSigningOutAll ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      <span>{isSigningOutAll ? "Signing out of all devices..." : "Sign out of all devices"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </SaaSCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
