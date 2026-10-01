"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Send, CheckCircle2, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { broadcastActivity } from "@/lib/realtime/broadcast";
import { trackEvent } from "@/lib/analytics/tracker";

const CATEGORIES = ["Food", "Service", "Ambiance", "Cleanliness", "Other"];

export default function FeedbackPage() {
  const params = useParams();
  const slug = params.restaurantSlug as string;

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("Restaurant");
  const [brandColor, setBrandColor] = useState<string>("#0F766E");

  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("Food");
  const [message, setMessage] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [honeypot, setHoneypot] = useState<string>("");

  const [mountTime, setMountTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMountTime(Date.now());
    // Fetch restaurant metadata by slug
    fetch(`/api/restaurants/by-slug/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const rId = json.data.restaurant.id;
          setRestaurantId(rId);
          setRestaurantName(json.data.restaurant.name);
          setBrandColor(json.data.restaurant.primaryColor || "#0F766E");
          trackEvent({
            restaurantId: rId,
            eventType: "feedback_open",
          });
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    // Minimum time check (must take at least 800ms to fill out)
    const duration = Date.now() - mountTime;
    if (duration < 800) {
      setErrorMessage("Please take a moment to provide your feedback.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Please enter a brief message before submitting.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          category,
          message: message.trim(),
          contact: isAnonymous ? null : contact.trim(),
          isAnonymous,
          website_hp: honeypot,
          submitDurationMs: duration,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSubmitted(true);
        if (restaurantId) {
          broadcastActivity(restaurantId, "feedback_submit", { rating, category });
        }
      } else {
        setErrorMessage(json.error?.message || "Failed to submit feedback. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
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
        {isSubmitted ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm my-auto mt-12 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Thank You!</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Your feedback has been sent directly to the management team. We appreciate your insights to help us continually elevate your dining experience.
            </p>
            <Link
              href={`/r/${slug}`}
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold text-xs text-white shadow-sm transition"
              style={{ backgroundColor: brandColor }}
            >
              Return to Dining Hub
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Guest Voice
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Share Your Experience</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your direct, honest feedback is sent straight to the chef and general manager.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                  How was your visit overall?
                </label>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoveredRating !== null ? hoveredRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                        aria-label={`${star} star rating`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isFilled
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200 stroke-slate-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        category === cat
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="feedback-message" className="text-xs font-semibold text-slate-700">
                    Your Thoughts
                  </label>
                  <span className="text-[10px] text-slate-400">{message.length}/1000</span>
                </div>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What did you enjoy most? What could we improve?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
              </div>

              {/* Anonymous Toggle & Optional Contact */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Submit anonymously (we will not collect your name or contact info)
                  </span>
                </label>

                {!isAnonymous && (
                  <div className="animate-in fade-in duration-200">
                    <label htmlFor="contact" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email or Phone (Optional for manager follow-up)
                    </label>
                    <input
                      id="contact"
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. guest@example.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Honeypot field (hidden from human users, filled by bots) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website_hp">Leave this empty</label>
                <input
                  id="website_hp"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send to Management</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
