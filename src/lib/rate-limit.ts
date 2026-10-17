import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window rate limiter store
const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000); // 10 minutes
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // every minute
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Shared across all server instances when Upstash is configured (needed on Vercel, where each
// function instance has its own memory); otherwise the in-memory store below (local dev).
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(options: RateLimitOptions): Ratelimit | null {
  if (!redis) return null;
  const key = `${options.limit}:${options.windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs} ms` as `${number} ms`),
      prefix: "noura_rl",
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(options);
  if (upstash) {
    try {
      const r = await upstash.limit(identifier);
      return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
    } catch (err) {
      // Redis unreachable: fall back to this instance's memory rather than blocking every request
      console.warn("Upstash rate limit unavailable, using in-memory fallback:", err);
    }
  }
  return memoryRateLimit(identifier, options);
}

function memoryRateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  const record = memoryStore.get(identifier) || { timestamps: [] };
  // Keep only timestamps within the current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + options.windowMs;
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  record.timestamps.push(now);
  memoryStore.set(identifier, record);

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    reset: now + options.windowMs,
  };
}
