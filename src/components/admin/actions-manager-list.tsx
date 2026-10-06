"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  Loader2,
  ExternalLink,
  Lightbulb,
  ChevronRight,
  Layers,
  AlertTriangle,
  Search,
  LayoutTemplate,
} from "lucide-react";
import { IconRenderer } from "@/components/shared/icon-renderer";
import { GuestActionData } from "@/types";
import { Button } from "@/components/ui/button";
import { broadcastActivity } from "@/lib/realtime/broadcast";
import { EmptyState } from "@/components/ui/empty-state";

interface ActionsManagerListProps {
  initialActions: GuestActionData[];
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
}

const AVAILABLE_ICONS = [
  "UtensilsCrossed",
  "Award",
  "Star",
  "Wifi",
  "MessageSquarePlus",
  "Gamepad2",
  "Gift",
  "Coffee",
  "Heart",
  "MapPin",
  "Phone",
  "Globe",
];

const PRESET_TEMPLATES = [
  {
    title: "Start Earning Rewards",
    description: "Collect digital stamps with every checkout for complimentary rewards.",
    icon: "Award",
    type: "REWARDS",
    badge: "Loyalty",
    badgeSecondary: "Rewards",
    urlPattern: (slug: string) => `/r/${slug}/rewards`,
  },
  {
    title: "Leave a Google Review",
    description: "Share your culinary experience with the community.",
    icon: "Star",
    type: "REVIEW",
    badge: "Feedback",
    badgeSecondary: "Review",
    urlPattern: () => `https://maps.google.com`,
  },
  {
    title: "View Menu",
    description: "Explore our seasonal farm-to-table lunch, dinner, and cocktails.",
    icon: "UtensilsCrossed",
    type: "MENU",
    badge: "Spring 2026",
    badgeSecondary: "Menu",
    urlPattern: (slug: string) => `/r/${slug}/menu`,
  },
  {
    title: "Connect to Wi-Fi",
    description: "High-speed complimentary wireless internet for guests.",
    icon: "Wifi",
    type: "WIFI",
    badge: "",
    badgeSecondary: "",
    urlPattern: (slug: string) => `/r/${slug}/wifi`,
  },
  {
    title: "Leave Anonymous Feedback",
    description: "Send direct, private feedback to our executive chef and managers.",
    icon: "MessageSquarePlus",
    type: "FEEDBACK",
    badge: "",
    badgeSecondary: "",
    urlPattern: (slug: string) => `/r/${slug}/feedback`,
  },
  {
    title: "Play Sudoku",
    description: "Enjoy a relaxing classic puzzle while waiting for your course.",
    icon: "Gamepad2",
    type: "GAME",
    badge: "",
    badgeSecondary: "",
    urlPattern: (slug: string) => `/r/${slug}/game`,
  },
];

export function ActionsManagerList({
  initialActions,
  restaurantId,
  restaurantName,
  restaurantSlug,
}: ActionsManagerListProps) {
  const [actions, setActions] = useState<GuestActionData[]>(initialActions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<GuestActionData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("UtensilsCrossed");
  const [type, setType] = useState("CUSTOM");
  const [url, setUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCount = actions.filter((a) => a.enabled).length;
  const uniqueTypes = Array.from(new Set(actions.map((a) => a.type)));

  // Filter actions
  const filteredActions = actions.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        a.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Check for duplicate title
  const isDuplicate = (newTitle: string, excludeId?: string): boolean => {
    const normalized = newTitle.trim().toLowerCase();
    return actions.some(
      (a) => a.title.trim().toLowerCase() === normalized && a.id !== excludeId
    );
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const openCreateModal = () => {
    setEditingAction(null);
    setTitle("");
    setDescription("");
    setIcon("UtensilsCrossed");
    setType("CUSTOM");
    setUrl("");
    setBadge("");
    setEnabled(true);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (action: GuestActionData) => {
    setEditingAction(action);
    setTitle(action.title);
    setDescription(action.description || "");
    setIcon(action.icon);
    setType(action.type);
    setUrl(action.url || "");
    setBadge(action.badge || "");
    setEnabled(action.enabled);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleToggleEnabled = async (action: GuestActionData) => {
    const nextState = !action.enabled;
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, enabled: nextState } : a))
    );
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setActions(actions);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    // Find the actual index in the full actions array
    const actionToMove = filteredActions[index];
    const actualIndex = actions.findIndex((a) => a.id === actionToMove.id);
    const targetIndex = direction === "up" ? actualIndex - 1 : actualIndex + 1;
    if (targetIndex < 0 || targetIndex >= actions.length) return;

    const newActions = [...actions];
    const [moved] = newActions.splice(actualIndex, 1);
    newActions.splice(targetIndex, 0, moved);

    const reordered = newActions.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setActions(reordered);

    try {
      await fetch(`/api/restaurants/${restaurantId}/actions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionIds: reordered.map((a) => a.id),
        }),
      });
    } catch {
      setActions(actions);
    }
  };

  const handleDuplicate = async (action: GuestActionData) => {
    // Check for duplicates
    let copyTitle = `${action.title} (Copy)`;
    let copyNum = 1;
    while (isDuplicate(copyTitle)) {
      copyNum++;
      copyTitle = `${action.title} (Copy ${copyNum})`;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: copyTitle,
        description: action.description,
        icon: action.icon,
        type: action.type,
        url: action.url,
        badge: action.badge,
        enabled: action.enabled,
        displayOrder: actions.length + 1,
      };

      const res = await fetch(`/api/restaurants/${restaurantId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActions((prev) => [...prev, json.data]);
        showSuccess(`"${copyTitle}" created`);
      } else {
        setErrorMessage(json.error || "Failed to duplicate");
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (actionId: string) => {
    setDeletingId(actionId);
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActions((prev) => prev.filter((a) => a.id !== actionId));
        setDeleteConfirmId(null);
        showSuccess("Action deleted successfully");
      } else {
        setErrorMessage(json.error || "Failed to delete action");
        // Re-add action if it was optimistically removed
        setDeleteConfirmId(null);
      }
    } catch {
      setErrorMessage("Network error — could not delete action");
      setDeleteConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (action: GuestActionData) => {
    const fullLink = action.url?.startsWith("http")
      ? action.url
      : `${window.location.origin}${action.url || `/r/${restaurantSlug}`}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedId(action.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddFromTemplate = async (template: (typeof PRESET_TEMPLATES)[0]) => {
    // Check for duplicate
    if (isDuplicate(template.title)) {
      setErrorMessage(
        `"${template.title}" already exists. Each action must have a unique title.`
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        title: template.title,
        description: template.description,
        icon: template.icon,
        type: template.type,
        url: template.urlPattern(restaurantSlug),
        badge: template.badge,
        enabled: true,
        displayOrder: actions.length + 1,
      };

      const res = await fetch(`/api/restaurants/${restaurantId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActions((prev) => [...prev, json.data]);
        showSuccess(`"${template.title}" added`);
      } else {
        setErrorMessage(json.error || "Failed to add template");
      }
    } catch {
      setErrorMessage("Network error — try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Duplicate check
    if (isDuplicate(title, editingAction?.id)) {
      setErrorMessage(
        `An action named "${title}" already exists. Please use a different title.`
      );
      return;
    }

    setIsLoading(true);

    const cleanBadge = badge && badge.trim().length > 0 ? badge.trim() : null;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      icon,
      type,
      url: url.trim() || null,
      badge: cleanBadge,
      enabled,
      displayOrder: editingAction ? editingAction.displayOrder : actions.length + 1,
    };

    try {
      if (editingAction) {
        const res = await fetch(`/api/actions/${editingAction.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setActions((prev) =>
            prev.map((a) => (a.id === editingAction.id ? { ...a, ...json.data, badge: cleanBadge } : a))
          );
          setIsModalOpen(false);
          showSuccess("Action updated successfully");
          broadcastActivity(restaurantId, "action_updated", { actionId: editingAction.id, action: json.data });
        } else {
          setErrorMessage(json.error || "Failed to update action");
        }
      } else {
        const res = await fetch(`/api/restaurants/${restaurantId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setActions((prev) => [...prev, json.data]);
          setIsModalOpen(false);
          showSuccess("Action created");
          broadcastActivity(restaurantId, "action_created", { action: json.data });
        } else {
          setErrorMessage(json.error || "Failed to create action");
        }
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getIconContainerStyle = (action: GuestActionData) => {
    switch (action.type) {
      case "REWARDS":
        return "bg-[#E6F4F1] text-[#0A7E6C] border-[#BDE3DB]";
      case "REVIEW":
        return "bg-[#FFF8E6] text-[#D97706] border-[#FDE68A]";
      case "MENU":
        return "bg-[#EBF7EE] text-[#16A34A] border-[#BBF7D0]";
      case "WIFI":
        return "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
      case "FEEDBACK":
        return "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]";
      case "GAME":
        return "bg-[#FFF4ED] text-[#EA580C] border-[#FED7AA]";
      default:
        return "bg-[#F0FDF4] text-[#0E473F] border-[#BBF7D0]";
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "REWARDS": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REVIEW": return "bg-amber-50 text-amber-700 border-amber-200";
      case "MENU": return "bg-green-50 text-green-700 border-green-200";
      case "WIFI": return "bg-blue-50 text-blue-700 border-blue-200";
      case "FEEDBACK": return "bg-purple-50 text-purple-700 border-purple-200";
      case "GAME": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2.5">
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
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Actions</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Guest Action Cards
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F7F2] dark:bg-emerald-950/40 text-[#0A7E6C] dark:text-emerald-400 border border-[#BCE8DB] dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                {activeCount} Active
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {actions.length} Total
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add, configure, reorder, or toggle quick actions visible to dining guests on their mobile landing hub.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* View Templates Button — prominent */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-[#0A7E6C] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold transition shadow-xs"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>View Templates</span>
            </button>

            <a
              href={`/r/${restaurantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Hub</span>
            </a>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#072C27] dark:bg-emerald-700 hover:bg-[#0E473F] dark:hover:bg-emerald-600 text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Action Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          {successMessage}
        </div>
      )}
      {errorMessage && !isModalOpen && !isTemplateModalOpen && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Guest Touchpoint Actions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage the interactive cards displayed on the mobile dining hub.
            </p>
          </div>

          {/* Search + Filter */}
          {actions.length > 3 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-40"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value="ALL">All Types</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Cards List */}
        <div className="space-y-3">
          {actions.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-6 h-6 text-slate-400" />}
              title="No actions configured"
              description="Create your first action card or choose from preset templates to display on your guest hub."
              action={
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={openCreateModal}>
                    Create Custom Action
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTemplateModalOpen(true)}
                  >
                    Load Templates
                  </Button>
                </div>
              }
            />
          ) : filteredActions.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              No actions match your search.
            </div>
          ) : (
            filteredActions.map((action, idx) => (
              <div
                key={action.id}
                className={`p-4 rounded-xl border transition-all duration-150 ${
                  deleteConfirmId === action.id
                    ? "bg-red-50/50 dark:bg-red-950/40 border-red-200 dark:border-red-800 ring-1 ring-red-200"
                    : action.enabled
                    ? "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-60"
                }`}
              >
                {/* Delete confirmation bar */}
                {deleteConfirmId === action.id ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <span className="font-bold text-red-800 dark:text-red-300">Delete "{action.title}"?</span>
                        <span className="text-red-600 dark:text-red-400 text-xs ml-2">This action cannot be undone.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(action.id)}
                        disabled={deletingId === action.id}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {deletingId === action.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Icon & Details */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getIconContainerStyle(
                          action
                        )}`}
                      >
                        <IconRenderer name={action.icon} className="w-6 h-6" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {action.title}
                          </h3>

                          {action.badge ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                              Badge: {action.badge}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                              No badge
                            </span>
                          )}

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200/80 dark:border-slate-700">
                            Type: {action.type}
                          </span>
                        </div>

                        {action.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {action.description}
                          </p>
                        )}

                        {action.url && (
                          <div className="flex items-center gap-1.5 text-xs text-[#0A7E6C] dark:text-emerald-400 font-mono">
                            <span className="truncate max-w-[280px] sm:max-w-md">
                              {action.url}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(action)}
                              className="text-slate-400 hover:text-[#0A7E6C] dark:hover:text-emerald-400 transition p-0.5"
                              title="Copy destination URL"
                            >
                              {copiedId === action.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Toggle */}
                      <div className="flex items-center gap-2 mr-1">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={action.enabled}
                          onClick={() => handleToggleEnabled(action)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0E473F] focus:ring-offset-2 ${
                            action.enabled ? "bg-[#0E473F] dark:bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              action.enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold min-w-[52px] ${
                            action.enabled ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {action.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {/* Move Up */}
                      <button
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg border border-slate-200/90 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-30 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === filteredActions.length - 1}
                        className="w-8 h-8 rounded-lg border border-slate-200/90 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-30 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(action)}
                        className="w-8 h-8 rounded-lg border border-slate-200/90 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition"
                        title="Edit Action"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(action)}
                        disabled={isLoading}
                        className="w-8 h-8 rounded-lg border border-slate-200/90 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition disabled:opacity-40"
                        title="Duplicate Action"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(action.id)}
                        className="w-8 h-8 rounded-lg border border-slate-200/90 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-800 flex items-center justify-center transition"
                        title="Delete Action"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action count footer */}
        {actions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredActions.length} of {actions.length} actions
              {searchQuery || typeFilter !== "ALL" ? " (filtered)" : ""}
            </span>
            <span>{activeCount} active · {actions.length - activeCount} disabled</span>
          </div>
        )}
      </div>

      {/* Bottom CTA Card */}
      <div className="bg-[#EAF6F3] dark:bg-slate-900/90 border border-[#BCE8DC] dark:border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#0A7E6C]/15 dark:bg-emerald-950/40 text-[#0A7E6C] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Create memorable guest experiences
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Show the right actions at the right time to engage your guests and drive loyalty.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A7E6C] dark:bg-emerald-600 text-white text-xs font-bold hover:bg-[#0E473F] dark:hover:bg-emerald-700 transition shadow-sm"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Explore Templates</span>
        </button>
      </div>

      {/* ─── Template Modal ─── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Action Card Templates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quickly add standard hospitality action cards to your dining hub.
                </p>
              </div>
              <button
                onClick={() => { setIsTemplateModalOpen(false); setErrorMessage(null); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {PRESET_TEMPLATES.map((tmpl, i) => {
                const alreadyAdded = isDuplicate(tmpl.title);
                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-3 ${
                      alreadyAdded
                        ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 opacity-60"
                        : "bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 hover:border-[#0E473F] dark:hover:border-emerald-500 hover:bg-emerald-50/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#0A7E6C] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                        <IconRenderer name={tmpl.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {tmpl.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(tmpl.type)}`}>
                        {tmpl.type}
                      </span>
                      {alreadyAdded ? (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Already added
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleAddFromTemplate(tmpl)}
                          className="px-2.5 py-1 rounded-lg bg-[#072C27] dark:bg-emerald-700 hover:bg-[#0E473F] dark:hover:bg-emerald-600 text-white text-[11px] font-semibold transition disabled:opacity-50"
                        >
                          + Add Card
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingAction ? "Edit Action Card" : "Add New Action Card"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mx-5 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form with inner scroll and Enter-key submit prevention */}
            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                // Ensure text only saves when clicking the save changes button, not on Enter
                if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                  e.preventDefault();
                }
              }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="action-title">
                    Action Title
                  </label>
                  <input
                    id="action-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. View Menu"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0E473F] shadow-xs text-xs sm:text-sm font-medium"
                  />
                  {title && isDuplicate(title, editingAction?.id) && (
                    <p className="mt-1 text-red-500 text-[11px] font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      An action with this title already exists
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="action-desc">
                    Short Description
                  </label>
                  <input
                    id="action-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Explore our seasonal farm-to-table dishes"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0E473F] shadow-xs text-xs sm:text-sm"
                  />
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Icon</label>
                  <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-28 overflow-y-auto">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl flex items-center justify-center transition ${
                          icon === ic
                            ? "bg-[#072C27] dark:bg-emerald-700 text-white shadow-sm"
                            : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200/60 dark:border-slate-600"
                        }`}
                        title={ic}
                      >
                        <IconRenderer name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="action-type">
                      Action Type
                    </label>
                    <select
                      id="action-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0E473F] shadow-xs text-xs sm:text-sm"
                    >
                      <option value="MENU">MENU</option>
                      <option value="REWARDS">REWARDS</option>
                      <option value="REVIEW">REVIEW</option>
                      <option value="WIFI">WIFI</option>
                      <option value="FEEDBACK">FEEDBACK</option>
                      <option value="GAME">GAME</option>
                      <option value="SOCIAL">SOCIAL</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="action-badge">
                      Badge (Optional)
                    </label>
                    <input
                      id="action-badge"
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Optional"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0E473F] shadow-xs text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="action-url">
                    Destination URL
                  </label>
                  <input
                    id="action-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={`/r/${restaurantSlug}/menu or https://...`}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0E473F] shadow-xs font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sm:bg-slate-50/60 dark:sm:bg-slate-800/60 flex items-center justify-end gap-2.5 shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isLoading || (!!title && isDuplicate(title, editingAction?.id))}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#072C27] dark:bg-emerald-700 hover:bg-[#0E473F] dark:hover:bg-emerald-600 text-white text-xs font-semibold transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingAction ? "Save Changes" : "Create Action"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
