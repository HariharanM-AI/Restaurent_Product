"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Check,
  Loader2,
  Trash2,
  Eye,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
  AlertCircle,
  Plus,
  ChevronRight,
  Star,
  Wifi,
  MessageSquare,
  ArrowLeft,
  Share2,
} from "lucide-react";

interface MenuManagerProps {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  restaurantTagline: string;
  initialData: {
    menuType: "pdf" | "images" | "link" | "items";
    pdfUrl: string;
    images: string[];
    externalUrl: string;
    title?: string;
    description?: string;
  };
}

export function MenuManager({
  restaurantId,
  restaurantName,
  restaurantSlug,
  restaurantTagline,
  initialData,
}: MenuManagerProps) {
  const [menuType, setMenuType] = useState<"pdf" | "images" | "link" | "items">(
    initialData.menuType || "pdf"
  );
  const [pdfUrl, setPdfUrl] = useState(initialData.pdfUrl || "");
  const [images, setImages] = useState<string[]>(initialData.images || []);
  const [externalUrl, setExternalUrl] = useState(initialData.externalUrl || "");
  const [title, setTitle] = useState(initialData.title || "View Menu");
  const [description, setDescription] = useState(
    initialData.description || "Explore seasonal farm-to-table lunch, dinner, and cocktails"
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetType: "pdf" | "image"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", restaurantId);
      formData.append("category", "menus");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (targetType === "pdf") {
          setPdfUrl(json.data.url);
          setMenuType("pdf");
        } else {
          setImages((prev) => [...prev, json.data.url]);
          setMenuType("images");
        }
      } else {
        setErrorMessage(json.error?.message || "File upload failed.");
      }
    } catch {
      setErrorMessage("Network error during upload.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuType,
          pdfUrl,
          images,
          externalUrl,
          title,
          description,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage("Menu settings and guest display synchronized successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.error?.message || "Failed to save menu configuration.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPdfFilename = () => {
    if (!pdfUrl) return "";
    const parts = pdfUrl.split("/");
    return parts[parts.length - 1] || "uploaded-menu.pdf";
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Breadcrumb and Header matching Image 4 */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2.5 flex-wrap">
          <Link href="/admin" className="hover:text-slate-800 dark:hover:text-slate-200 transition">
            Restaurants
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <Link
            href={`/admin/restaurants/${restaurantId}/dashboard`}
            className="hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            {restaurantName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Menu Manager</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Menu & Culinary Catalog
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload your official menu PDF, attach multi-page food photography, link an external POS menu, or customize interactive items.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in-50">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-2xl flex items-center gap-2.5 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Layout - Full Width across container */}
      <div className="w-full space-y-6">
        {/* Card 1: Guest Action Card Display */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-7 space-y-5 w-full overflow-hidden">
          <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F2] dark:bg-emerald-950/60 text-[#0A7E6C] dark:text-emerald-400 border border-[#BCE8DB] dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Guest Action Card Display</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure how the menu card appears on your public guest hub
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200" htmlFor="card-title">
                  Action Card Title
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {title.length}/50
                </span>
              </div>
              <input
                id="card-title"
                type="text"
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. View Menu"
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0E473F] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200" htmlFor="card-desc">
                  Short Description / Teaser
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {description.length}/100
                </span>
              </div>
              <input
                id="card-desc"
                type="text"
                maxLength={100}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Explore seasonal farm-to-table lunch, dinner, and cocktails"
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0E473F] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Menu Delivery Format */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-7 space-y-6 w-full overflow-hidden">
          <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F2] dark:bg-emerald-950/60 text-[#0A7E6C] dark:text-emerald-400 border border-[#BCE8DB] dark:border-emerald-800/40 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Menu Delivery Format</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose how diners will view your food and beverage offerings
              </p>
            </div>
          </div>

            {/* 4 Selectable Format Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setMenuType("pdf")}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                  menuType === "pdf"
                    ? "bg-[#072C27] dark:bg-emerald-700 text-white border-[#072C27] dark:border-emerald-600 shadow-md shadow-[#072C27]/10"
                    : "bg-white dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {menuType === "pdf" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] absolute top-3 left-3" />
                )}
                <FileText className="w-5 h-5" />
                <span className="text-xs font-bold">PDF Menu</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuType("images")}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                  menuType === "images"
                    ? "bg-[#072C27] dark:bg-emerald-700 text-white border-[#072C27] dark:border-emerald-600 shadow-md shadow-[#072C27]/10"
                    : "bg-white dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {menuType === "images" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] absolute top-3 left-3" />
                )}
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs font-bold">Photo Menu</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuType("link")}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                  menuType === "link"
                    ? "bg-[#072C27] dark:bg-emerald-700 text-white border-[#072C27] dark:border-emerald-600 shadow-md shadow-[#072C27]/10"
                    : "bg-white dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {menuType === "link" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] absolute top-3 left-3" />
                )}
                <ExternalLink className="w-5 h-5" />
                <span className="text-xs font-bold">External Link</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuType("items")}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                  menuType === "items"
                    ? "bg-[#072C27] dark:bg-emerald-700 text-white border-[#072C27] dark:border-emerald-600 shadow-md shadow-[#072C27]/10"
                    : "bg-white dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {menuType === "items" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] absolute top-3 left-3" />
                )}
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold">Interactive Items</span>
              </button>
            </div>

            {/* Mode 1: PDF Menu Section matching Image 4 */}
            {menuType === "pdf" && (
              <div className="p-4 sm:p-5 bg-[#EAF6F3]/40 dark:bg-slate-800/50 border border-[#BCE8DC] dark:border-slate-700 rounded-2xl space-y-4 animate-in fade-in-50 w-full overflow-hidden">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                    Upload Printable / Digital Menu PDF
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload your restaurant&apos;s official PDF menu. Guests can view it in-app with instant zoom.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#072C27] dark:bg-emerald-700 hover:bg-[#0E473F] dark:hover:bg-emerald-600 text-white font-semibold text-xs cursor-pointer shadow-sm transition flex items-center justify-center gap-2 shrink-0">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isUploading ? "Uploading..." : "Choose PDF File"}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, "pdf")}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">or paste direct PDF link:</span>
                </div>

                <div className="w-full min-w-0">
                  <input
                    type="text"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="/uploads/restaurant-menu.pdf or https://..."
                    className="w-full min-w-0 h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0E473F] dark:focus:ring-emerald-500"
                  />
                </div>

                {/* Uploaded PDF Row */}
                {pdfUrl ? (
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs min-w-0 overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {getPdfFilename()}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
                          Print-Ready PDF • In-App Fast Zoom Enabled
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="View PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPdfUrl("")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Remove PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      No PDF uploaded yet. Click &ldquo;Choose PDF File&rdquo; or enter a PDF link above.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Multi-Page Photos */}
            {menuType === "images" && (
              <div className="p-4 sm:p-5 bg-[#EAF6F3]/40 dark:bg-slate-800/50 border border-[#BCE8DC] dark:border-slate-700 rounded-2xl space-y-4 animate-in fade-in-50 w-full overflow-hidden">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                    Multi-Page Menu Photographs
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload high-resolution photos of your physical food &amp; drink menu pages (up to 4 pages).
                  </p>
                </div>

                <label className="inline-flex px-4 py-2.5 rounded-xl bg-[#072C27] dark:bg-emerald-700 hover:bg-[#0E473F] dark:hover:bg-emerald-600 text-white font-semibold text-xs cursor-pointer shadow-sm transition items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isUploading ? "Uploading..." : "Add Menu Page Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => handleFileUpload(e, "image")}
                    className="hidden"
                  />
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-xs aspect-[3/4]"
                      >
                        <img
                          src={img}
                          alt={`Menu Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-600 shadow cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                          Page {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: External Link */}
            {menuType === "link" && (
              <div className="p-4 sm:p-5 bg-[#EAF6F3]/40 dark:bg-slate-800/50 border border-[#BCE8DC] dark:border-slate-700 rounded-2xl space-y-3 animate-in fade-in-50 w-full overflow-hidden">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                    External POS or Web Menu Link
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Guests tapping your menu card will be immediately redirected to this URL (e.g. Toast, Square, BentoBox).
                  </p>
                </div>

                <div className="w-full min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="ext-url">
                    External Menu URL
                  </label>
                  <input
                    id="ext-url"
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://www.toasttab.com/your-restaurant/menu"
                    className="w-full min-w-0 h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0E473F] dark:focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Mode 4: Interactive Items */}
            {menuType === "items" && (
              <div className="p-4 sm:p-5 bg-[#EAF6F3]/40 dark:bg-slate-800/50 border border-[#BCE8DC] dark:border-slate-700 rounded-2xl space-y-2 animate-in fade-in-50 w-full overflow-hidden">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Built-in Interactive Plate Experience
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Guests browse seasonal appetizers, mains, desserts, and cocktails categorized with dietary filters directly within the Noura template.
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-end w-full">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#072C27] hover:bg-[#0E473F] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md shadow-[#072C27]/10 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Menu Configuration</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

