import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("Sliding Window Rate Limiter", () => {
  it("permits requests within quota and blocks when quota is exceeded", async () => {
    const key = `test_user_${Date.now()}`;
    const options = { limit: 3, windowMs: 1000 };

    const r1 = await rateLimit(key, options);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await rateLimit(key, options);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await rateLimit(key, options);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit
    const r4 = await rateLimit(key, options);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});
