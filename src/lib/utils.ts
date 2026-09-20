import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a text string into a clean, URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word characters
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Formats a standardized Wi-Fi connection QR payload.
 * Format: WIFI:S:MySSID;T:WPA;P:MyPassword;;
 */
export function generateWifiPayload(
  ssid: string,
  password?: string,
  authType: "WPA" | "WEP" | "nopass" = "WPA"
): string {
  const cleanSsid = ssid.replace(/([\\;,:"])/g, "\\$1");
  const cleanPass = (password || "").replace(/([\\;,:"])/g, "\\$1");
  const type = password ? authType : "nopass";

  return `WIFI:S:${cleanSsid};T:${type};P:${cleanPass};;`;
}

/**
 * Strips potential HTML/script injection tags.
 */
export function sanitizeString(val: string): string {
  return val.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
