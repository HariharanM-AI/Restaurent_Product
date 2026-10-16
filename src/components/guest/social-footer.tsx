"use client";

import React from "react";
import { Globe, Share2 } from "lucide-react";
import { SocialLinkData } from "@/types";
import { trackEvent } from "@/lib/analytics/tracker";

interface SocialFooterProps {
  socialLinks: SocialLinkData[];
  website?: string | null;
  restaurantId: string;
}

// Admin-entered value only; bare domains get https://, anything else (javascript:, @handles) is ignored
export const toHref = (url?: string | null) => {
  const v = url?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return /^[\w-]+(\.[\w-]+)+/.test(v) ? `https://${v}` : null;
};

export function SocialFooter({ socialLinks, website, restaurantId }: SocialFooterProps) {
  // Website comes from the profile's "Official Website" field, not a separate (seeded) social link row
  const links = [
    { platform: "INSTAGRAM", href: toHref(socialLinks?.find((s) => s.platform === "INSTAGRAM")?.url) },
    { platform: "FACEBOOK", href: toHref(socialLinks?.find((s) => s.platform === "FACEBOOK")?.url) },
    { platform: "WEBSITE", href: toHref(website) },
  ];
  const tile =
    "w-11 h-11 rounded-2xl bg-white/90 dark:bg-[#131B2B]/90 border border-slate-200/80 dark:border-white/[0.1] shadow-xs flex items-center justify-center backdrop-blur-xs";

  const getPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case "INSTAGRAM":
        return (
          <svg
            className="w-5 h-5 fill-none stroke-[#E1306C] stroke-[2.2]"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        );
      case "FACEBOOK":
        return (
          <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        );
      case "YOUTUBE":
        return (
          <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24">
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
            <polygon points="10 15 15 12 10 9 10 15" fill="#FFFFFF" />
          </svg>
        );
      case "WEBSITE":
        return <Globe className="w-5 h-5 text-[#334155] stroke-[2]" />;
      default:
        return <Share2 className="w-5 h-5 text-slate-600 stroke-[2]" />;
    }
  };

  const handleClick = (platform: string) => {
    trackEvent({
      restaurantId,
      eventType: "social_click",
      metadata: { platform },
    });
  };

  return (
    <div className="py-8 px-4 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
        Connect With Us
      </p>
      <div className="flex items-center justify-center gap-3.5 flex-wrap">
        {links.map(({ platform, href }) =>
          href ? (
            <a
              key={platform}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(platform)}
              className={`${tile} hover:bg-white dark:hover:bg-[#1b253b] hover:shadow-card-hover transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer`}
              aria-label={`Visit our ${platform}`}
            >
              {getPlatformIcon(platform)}
            </a>
          ) : (
            // Admin left this field empty: tapping does nothing
            <button key={platform} type="button" disabled aria-label={`${platform} link not added`} className={`${tile} opacity-50 cursor-default`}>
              {getPlatformIcon(platform)}
            </button>
          )
        )}
      </div>
      <div className="mt-6 text-xs flex items-center justify-center gap-1.5 font-medium">
        <span className="text-slate-400 dark:text-slate-500">Powered by</span>
        <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">Noura</span>
      </div>
    </div>
  );
}
