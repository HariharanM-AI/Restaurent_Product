// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Plain function (not a vi.fn spy) so a simulated Redis outage is a normal awaited rejection
const upstash = vi.hoisted(() => ({
  calls: [] as string[],
  respond: (): Promise<unknown> => Promise.resolve({ success: true, limit: 1, remaining: 0, reset: 0 }),
}));
vi.mock("@upstash/redis", () => ({ Redis: vi.fn() }));
vi.mock("@upstash/ratelimit", () => {
  function Ratelimit() {
    return {
      limit: (id: string) => {
        upstash.calls.push(id);
        return upstash.respond();
      },
    };
  }
  Ratelimit.slidingWindow = (n: number, w: string) => ({ n, w });
  return { Ratelimit };
});

const loadWithUpstash = async () => {
  vi.resetModules();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  return (await import("@/lib/rate-limit")).rateLimit;
};

beforeEach(() => {
  upstash.calls.length = 0;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.restoreAllMocks();
});

describe("rateLimit shared store", () => {
  it("uses Upstash (shared across server instances) when it is configured", async () => {
    const rateLimit = await loadWithUpstash();
    upstash.respond = () => Promise.resolve({ success: false, limit: 5, remaining: 0, reset: 123 });

    await expect(rateLimit("signin_ip_1", { limit: 5, windowMs: 60_000 })).resolves.toEqual({
      success: false,
      limit: 5,
      remaining: 0,
      reset: 123,
    });
    expect(upstash.calls).toEqual(["signin_ip_1"]);
  });

  it("falls back to in-memory limits if Redis is unreachable, instead of blocking everyone", async () => {
    const rateLimit = await loadWithUpstash();
    upstash.respond = () => Promise.reject(new Error("network down"));
    const opts = { limit: 2, windowMs: 60_000 };
    const key = `fallback_${Date.now()}`;

    expect((await rateLimit(key, opts)).success).toBe(true);
    expect((await rateLimit(key, opts)).success).toBe(true);
    expect((await rateLimit(key, opts)).success).toBe(false); // memory limiter still enforces
    expect(upstash.calls).toHaveLength(3);
  });

  it("uses the in-memory store when Upstash isn't configured (local dev)", async () => {
    vi.resetModules();
    const { rateLimit } = await import("@/lib/rate-limit");
    expect((await rateLimit(`local_${Date.now()}`, { limit: 1, windowMs: 60_000 })).success).toBe(true);
    expect(upstash.calls).toHaveLength(0);
  });
});
