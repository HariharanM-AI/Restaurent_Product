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

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): Promise<RateLimitResult> {
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
