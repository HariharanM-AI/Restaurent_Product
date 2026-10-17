// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = {
  restaurant: { findUnique: vi.fn() },
  analyticsEvent: { create: vi.fn() },
  loyaltyCheckoutSession: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
};
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

const rateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));

const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession }));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect }));

const json = (url: string, body: unknown) => new NextRequest(url, { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  rateLimit.mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: 0 });
});

describe("Stamp claims are rate-limited per IP", () => {
  it("returns 429 before touching the database once the limit is hit", async () => {
    rateLimit.mockResolvedValue({ success: false, limit: 20, remaining: 0, reset: 0 });
    const { POST } = await import("@/app/api/loyalty/checkout/[token]/claim/route");

    const res = await POST(json("http://localhost/x", { anonymousBrowserId: "wal_12345678", idempotencyKey: "idem_12345678" }), {
      params: Promise.resolve({ token: "tok" }),
    });

    expect(res.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith(expect.stringMatching(/^claim_ip_/), { limit: 20, windowMs: 60_000 });
    expect(prismaMock.loyaltyCheckoutSession.findUnique).not.toHaveBeenCalled();
  });
});

describe("Analytics only records events for real, active venues", () => {
  const event = { restaurantId: "rest_1", eventType: "guest_page_view", anonymousSessionId: "sess_12345678" };

  it("rejects an unknown or inactive restaurant without writing", async () => {
    const { POST } = await import("@/app/api/analytics/events/route");
    prismaMock.restaurant.findUnique.mockResolvedValueOnce(null);
    expect((await POST(json("http://localhost/x", event))).status).toBe(404);
    prismaMock.restaurant.findUnique.mockResolvedValueOnce({ status: "SUSPENDED" });
    expect((await POST(json("http://localhost/x", event))).status).toBe(404);
    expect(prismaMock.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it("records events for an active restaurant", async () => {
    const { POST } = await import("@/app/api/analytics/events/route");
    prismaMock.restaurant.findUnique.mockResolvedValue({ status: "ACTIVE" });
    expect((await POST(json("http://localhost/x", event))).status).toBe(200);
    expect(prismaMock.analyticsEvent.create).toHaveBeenCalledOnce();
  });
});

describe("Platform console is server-gated", () => {
  const render = async () => {
    const { default: Layout } = await import("@/app/admin/platform/layout");
    return Layout({ children: "console" });
  };

  it("sends anyone who isn't a platform admin (per the database) back to /admin", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", role: "PLATFORM_ADMIN" } }); // stale session claim
    prismaMock.user.findUnique.mockResolvedValue({ role: "OWNER" });
    await expect(render()).rejects.toThrow("REDIRECT:/admin");

    getSession.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("REDIRECT:/admin");
  });

  it("lets a platform admin through", async () => {
    getSession.mockResolvedValue({ user: { id: "admin" } });
    prismaMock.user.findUnique.mockResolvedValue({ role: "PLATFORM_ADMIN" });
    await expect(render()).resolves.toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("Password policy: at least 10 characters", () => {
  it("sign-up rejects a 9-character password", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const res = await POST(json("http://localhost/x", { name: "Owner", email: "o@cafe.com", password: "123456789" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toMatch(/10 characters/);
  });

  it("password change rejects a 9-character password", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    const { POST } = await import("@/app/api/user/password/route");
    const res = await POST(json("http://localhost/x", { currentPassword: "old-password", newPassword: "123456789", confirmPassword: "123456789" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/10 characters/);
  });
});

describe("Content-Security-Policy (report-only)", () => {
  it("is sent on every page and allows Supabase storage and Google sign-in", async () => {
    const { default: config } = await import("../../next.config");
    const rules = await config.headers!();
    const csp = rules.find((r) => r.source === "/(.*)")?.headers.find((h) => h.key === "Content-Security-Policy-Report-Only")?.value;

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("form-action 'self' https://accounts.google.com");
    expect(csp).toMatch(/img-src [^;]*https:\/\/[a-z0-9-]+\.supabase\.co/);
    expect(csp).toContain("object-src 'none'");
  });
});

describe("Post-login redirect stays on this site", () => {
  it("keeps same-site paths and replaces anything pointing elsewhere", async () => {
    const { safeCallbackUrl } = await import("@/lib/auth/safe-callback");
    expect(safeCallbackUrl("/admin/restaurants/r1/loyalty?tab=2")).toBe("/admin/restaurants/r1/loyalty?tab=2");
    expect(safeCallbackUrl(null)).toBe("/admin");
    expect(safeCallbackUrl("https://evil.example")).toBe("/admin");
    expect(safeCallbackUrl("//evil.example/x")).toBe("/admin");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/admin"); // browsers read "\" as "/"
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/admin");
  });
});
