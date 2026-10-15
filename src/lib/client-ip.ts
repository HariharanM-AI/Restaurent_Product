type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined | null;

function read(headers: HeaderSource, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const raw = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Resolves the client IP from headers the hosting platform sets itself,
 * so a caller cannot rotate it by sending their own X-Forwarded-For.
 *   Vercel  → x-real-ip
 *   Netlify → x-nf-client-connection-ip
 * Falls back to the left-most X-Forwarded-For hop (local dev / other proxies).
 */
export function getClientIp(headers: HeaderSource): string {
  const trusted = read(headers, "x-real-ip") || read(headers, "x-nf-client-connection-ip");
  if (trusted) return trusted.trim();

  const forwarded = read(headers, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
