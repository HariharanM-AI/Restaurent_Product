"use client";

import React from "react";
import { Globe, Share2 } from "lucide-react";
import { SocialLinkData } from "@/types";
import { trackEvent } from "@/lib/analytics/tracker";

interface SocialFooterProps {
  socialLinks: SocialLinkData[];
  restaurantId: string;
}

export function SocialFooter({ socialLinks, restaurantId }: SocialFooterProps) {
  if (!socialLinks || socialLinks.length === 0) {
    return null;
  }

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
    <div className="py-6 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
        Connect With Us
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(link.platform)}
            className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={`Visit our ${link.platform}`}
          >
            {getPlatformIcon(link.platform)}
          </a>
        ))}
      </div>
      <div className="mt-5 text-xs flex items-center justify-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Powered by</span>
        <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">Noura</span>
      </div>
    </div>
  );
}
