"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  UtensilsCrossed,
  Leaf,
  Sparkles,
  FileText,
  Download,
  ExternalLink,
  Eye,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  category: "Starters" | "Mains" | "Desserts" | "Drinks";
  tags?: string[];
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    name: "Wood-Fired Sourdough & Whipped Ricotta",
    description: "Local wildflower honeycomb, roasted garlic oil, sea salt, garden thyme",
    price: "$14",
    category: "Starters",
    tags: ["Vegetarian"],
  },
  {
    name: "Crispy Brussels Sprouts",
    description: "Spiced pomegranate reduction, toasted Sicilian pistachios, shaved pecorino",
    price: "$16",
    category: "Starters",
    tags: ["Vegetarian", "Gluten-Free"],
  },
  {
    name: "Cured Hamachi Crudo",
    description: "Citrus yuzu ponzu, pickled serrano chili, avocado purée, crispy shallots",
    price: "$19",
    category: "Starters",
    tags: ["Gluten-Free", "Chef's Pick"],
  },
  {
    name: "Pan-Roasted King Salmon",
    description: "Cauliflower-parsnip purée, braised leeks, brown butter emulsion",
    price: "$34",
    category: "Mains",
    tags: ["Gluten-Free"],
  },
  {
    name: "Braised Short Rib Cavatelli",
    description: "Hand-rolled pasta, slow-braised beef, wild chanterelles, parmesan brodo",
    price: "$31",
    category: "Mains",
    tags: ["House Specialty"],
  },
  {
    name: "Wood-Grilled Prime Ribeye (12oz)",
    description: "Charred broccolini, bone marrow butter, chimichurri sauce",
    price: "$48",
    category: "Mains",
    tags: ["Gluten-Free"],
  },
  {
    name: "Roasted Acorn Squash Risotto",
    description: "Carnaroli rice, crispy sage, cold-pressed pumpkin seed oil, aged parmesan",
    price: "$26",
    category: "Mains",
    tags: ["Vegetarian", "Gluten-Free"],
  },
  {
    name: "Warm Valrhona Dark Chocolate Tart",
    description: "Salted caramel core, espresso bean gelato, candied hazelnut crunch",
    price: "$14",
    category: "Desserts",
    tags: ["Vegetarian"],
  },
  {
    name: "Honey Vanilla Bean Panna Cotta",
    description: "Macerated seasonal blackberries, crisp almond tuile, micro mint",
    price: "$12",
    category: "Desserts",
    tags: ["Gluten-Free"],
  },
  {
    name: "Harvest Smoked Old Fashioned",
    description: "Bourbon, smoked organic maple syrup, angostura bitters, flamed orange peel",
    price: "$17",
    category: "Drinks",
    tags: ["Signature"],
  },
  {
    name: "Botanical Garden Spritz",
    description: "Empress gin, elderflower liqueur, sparkling prosecco, cucumber ribbon",
    price: "$16",
    category: "Drinks",
    tags: ["Craft"],
  },
];

const CATEGORIES: Array<"Starters" | "Mains" | "Desserts" | "Drinks"> = [
  "Starters",
  "Mains",
  "Desserts",
  "Drinks",
];

export default function MenuPage() {
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [brandColor, setBrandColor] = useState("#0F766E");
  const [menuType, setMenuType] = useState<"pdf" | "images" | "link" | "items">("items");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<"Starters" | "Mains" | "Desserts" | "Drinks">("Starters");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/restaurants/by-slug/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const rest = json.data.restaurant;
          setRestaurantName(rest.name);
          setBrandColor(rest.primaryColor || "#0F766E");

          const menuAction = json.data.actions?.find((a: any) => a.type === "MENU");
          if (menuAction?.metadata) {
            try {
              const meta = JSON.parse(menuAction.metadata);
              if (meta.menuType) setMenuType(meta.menuType);
              if (meta.pdfUrl) setPdfUrl(meta.pdfUrl);
              if (meta.images && Array.isArray(meta.images)) setImages(meta.images);
              if (meta.externalUrl) setExternalUrl(meta.externalUrl);
            } catch {
              // use default
            }
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  const hasUploadedDocument =
    (menuType === "pdf" && pdfUrl) ||
    (menuType === "images" && images.length > 0) ||
    (menuType === "link" && externalUrl);

  const filteredItems = DEFAULT_MENU_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between">
        <Link
          href={`/r/${slug}`}
          className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </Link>
        <span className="text-xs font-extrabold text-slate-900 truncate max-w-[180px]">
          {restaurantName}
        </span>
        <div className="flex items-center gap-1">
          {menuType === "pdf" && pdfUrl && (
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-teal-700 hover:bg-teal-50 transition"
              title="Download Menu PDF"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-4 pb-12 flex flex-col">
        {/* Header Title */}
        <div className="text-center py-4">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-md shadow-teal-900/10"
            style={{ backgroundColor: brandColor }}
          >
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dining & Beverage Menu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Artisanal plates, fresh seasonal selections & craft pairings
          </p>
        </div>

        {/* Mode 1: PDF Menu Viewer */}
        {hasUploadedDocument && menuType === "pdf" && (
          <div className="space-y-3 animate-in fade-in-50">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm h-[580px] relative">
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-none"
                title={`${restaurantName} PDF Menu`}
              />
            </div>

            <div className="flex items-center gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Full-Screen PDF</span>
              </a>
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}

        {/* Mode 2: Multi-Page Photo Menu */}
        {hasUploadedDocument && menuType === "images" && (
          <div className="space-y-4 animate-in fade-in-50">
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      activeImageIndex === idx
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    Page {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm relative group aspect-[3/4]">
              {images[activeImageIndex] && (
                <img
                  src={images[activeImageIndex]}
                  alt={`Menu Page ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain bg-slate-900/5"
                />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <a
              href={images[activeImageIndex]}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Maximize2 className="w-4 h-4" />
              <span>View Full-Size Page {activeImageIndex + 1}</span>
            </a>
          </div>
        )}

        {/* Mode 3: External Link Gateway */}
        {hasUploadedDocument && menuType === "link" && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm my-auto animate-in fade-in-50">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 mx-auto flex items-center justify-center shadow-xs">
              <ExternalLink className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Online Menu</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tap below to open our live contactless ordering and dining catalog.
              </p>
            </div>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold shadow-md transition"
            >
              <span>Open Online Menu</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Mode 4: Interactive Dish Items (Fallback when no document is uploaded) */}
        {!hasUploadedDocument && (
          <div className="space-y-4 animate-in fade-in-50">
            {/* Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 sticky top-[57px] bg-[#F8FAFC] z-20">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items List */}
            <div className="space-y-3">
              {filteredItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.name}</h3>
                    <span
                      className="font-extrabold text-sm shrink-0 font-mono"
                      style={{ color: brandColor }}
                    >
                      {item.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                        >
                          {tag.includes("Vegetarian") ? (
                            <Leaf className="w-2.5 h-2.5 text-emerald-600" />
                          ) : tag.includes("Chef") || tag.includes("Signature") || tag.includes("Specialty") ? (
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          ) : null}
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
