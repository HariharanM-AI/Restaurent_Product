/**
 * Keeps post-login redirects on this site: returns a same-origin path, else the fallback.
 * Parsed as a URL rather than string-matched, because "//evil.com" and "/\evil.com" both
 * resolve to another host in browsers.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/admin"): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  const base = "http://same.origin";
  try {
    const url = new URL(raw, base);
    return url.origin === base ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
