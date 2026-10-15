// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { processFeedbackImage, FeedbackImageError } from "@/lib/uploads/feedback-images";

vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/auth/session", () => ({ verifyRestaurantAccess: vi.fn() }));
vi.mock("@/lib/supabase/storage", () => ({ BUCKET_NAME: "restaurant-assets", getStorageClient: vi.fn(), uploadClientAsset: vi.fn(), deleteClientAsset: vi.fn() }));

const toFile = (buf: Buffer, name: string, type: string) => new File([new Uint8Array(buf)], name, { type });

describe("processFeedbackImage", () => {
  it("rejects a file whose bytes are not an image, whatever its MIME type claims", async () => {
    const fake = toFile(Buffer.from("<html><script>alert(1)</script></html>"), "photo.jpg", "image/jpeg");
    await expect(processFeedbackImage(fake)).rejects.toBeInstanceOf(FeedbackImageError);
  });

  it("strips EXIF/GPS metadata and re-encodes to JPEG", async () => {
    const withExif = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#c33" } })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Make: "TestCam", Software: "secret-device" } } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const out = await processFeedbackImage(toFile(withExif, "p.jpg", "image/jpeg"));
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.exif).toBeUndefined();
  });

  it("downsizes very large photos to a 1600px longest edge", async () => {
    const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#fff" } }).png().toBuffer();
    const out = await processFeedbackImage(toFile(big, "big.png", "image/png"));
    const meta = await sharp(out).metadata();
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(1600);
  });
});

describe("POST /api/restaurants/[id]/feedback with photos", () => {
  it("rejects more than 3 photos before processing anything", async () => {
    const { POST } = await import("@/app/api/restaurants/[id]/feedback/route");
    const tiny = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#fff" } }).jpeg().toBuffer();
    const form = new FormData();
    form.append("payload", JSON.stringify({ rating: 5, category: "Food", message: "Lovely dinner", isAnonymous: true }));
    for (let i = 0; i < 4; i++) form.append("images", toFile(tiny, `p${i}.jpg`, "image/jpeg"));

    const req = new NextRequest("http://localhost/api/restaurants/r1/feedback", {
      method: "POST",
      body: form,
      headers: { "x-real-ip": "203.0.113.50" },
    });
    const res = await POST(req, { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("TOO_MANY_IMAGES");
  });
});
