// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { detectFileType } from "@/lib/uploads/file-signature";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";

const prismaMock = {
  restaurant: { findUnique: vi.fn() },
  restaurantMember: { findFirst: vi.fn() },
  loyaltyWallet: { findUnique: vi.fn(), create: vi.fn() },
  loyaltyProgram: { findUnique: vi.fn() },
};
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

const verifyRestaurantAccess = vi.fn();
const getSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({ verifyRestaurantAccess, getSession }));

const uploadClientAsset = vi.fn();
vi.mock("@/lib/supabase/storage", () => ({ uploadClientAsset }));

beforeEach(() => vi.clearAllMocks());

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("detectFileType", () => {
  it("recognises each allowed format by its bytes", () => {
    expect(detectFileType(Buffer.from("%PDF-1.7\n"))).toBe("application/pdf");
    expect(detectFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectFileType(PNG)).toBe("image/png");
    expect(detectFileType(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(detectFileType(Buffer.from("GIF89a\0\0"))).toBe("image/gif");
    expect(detectFileType(Buffer.from("\0\0\0\x1cftypavif\0\0"))).toBe("image/avif");
  });

  it("returns null for anything else, e.g. HTML or plain text", () => {
    expect(detectFileType(Buffer.from("<!doctype html><p>hi</p>"))).toBeNull();
    expect(detectFileType(Buffer.from("hello"))).toBeNull();
  });
});

describe("POST /api/upload", () => {
  const upload = async (bytes: Buffer, declaredType: string) => {
    const { POST } = await import("@/app/api/upload/route");
    const form = new FormData();
    form.append("file", new File([new Uint8Array(bytes)], "f.png", { type: declaredType }));
    form.append("restaurantId", "rest_A");
    return POST(new Request("http://localhost/api/upload", { method: "POST", body: form }));
  };

  it("rejects a file whose bytes don't match an allowed type, even if it claims image/png", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    const res = await upload(Buffer.from("<!doctype html><p>not an image</p>"), "image/png");
    expect(res.status).toBe(400);
    expect(uploadClientAsset).not.toHaveBeenCalled();
  });

  it("only allows owners, managers and platform admins to upload", async () => {
    getSession.mockResolvedValue({ user: { id: "staff1" } });
    verifyRestaurantAccess.mockResolvedValue({ authorized: false, error: "Insufficient permissions" });
    const res = await upload(PNG, "image/png");
    expect(res.status).toBe(403);
    expect(verifyRestaurantAccess).toHaveBeenCalledWith("rest_A", ["PLATFORM_ADMIN", "OWNER", "MANAGER"]);
  });

  it("stores a genuine file with the detected type, not the declared one", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    uploadClientAsset.mockResolvedValue({ publicUrl: "https://x/y.png", storagePath: "p", filename: "y.png" });
    const res = await upload(PNG, "application/octet-stream");
    expect(res.status).toBe(200);
    expect(uploadClientAsset).toHaveBeenCalledWith(expect.objectContaining({ mimeType: "image/png" }));
  });
});

describe("PUT /api/restaurants/[id]/menu link validation", () => {
  const put = async (body: Record<string, unknown>) => {
    const { PUT } = await import("@/app/api/restaurants/[id]/menu/route");
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    prismaMock.restaurant.findUnique.mockResolvedValue(null); // validation passing → reaches this lookup → 404
    return PUT(new Request("http://localhost/x", { method: "PUT", body: JSON.stringify(body) }), {
      params: Promise.resolve({ id: "rest_A" }),
    });
  };

  it("rejects a PDF that isn't hosted in our storage", async () => {
    expect((await put({ menuType: "pdf", pdfUrl: "https://elsewhere.example/menu.pdf" })).status).toBe(400);
    expect((await put({ menuType: "pdf", pdfUrl: "http://proj.supabase.co/storage/v1/object/public/a.pdf" })).status).toBe(400);
  });

  it("rejects a non-https external link", async () => {
    expect((await put({ menuType: "link", externalUrl: "http://menu.example" })).status).toBe(400);
    expect((await put({ menuType: "link", externalUrl: "ftp://menu.example" })).status).toBe(400);
  });

  it("accepts our own storage PDF and https links", async () => {
    expect(
      (await put({ menuType: "pdf", pdfUrl: "https://proj.supabase.co/storage/v1/object/public/restaurant-assets/m.pdf" })).status
    ).toBe(404);
    expect((await put({ menuType: "link", externalUrl: "https://menu.example/today" })).status).toBe(404);
  });
});

describe("GET /api/loyalty/wallet", () => {
  const get = async (restaurantId: string, browserId: string) => {
    const { GET } = await import("@/app/api/loyalty/wallet/route");
    return GET(
      new NextRequest(`http://localhost/api/loyalty/wallet?restaurantId=${restaurantId}&browserId=${browserId}`, {
        headers: { "x-real-ip": "198.51.100.23" },
      })
    );
  };

  it("returns 404 and creates nothing for a restaurant that doesn't exist", async () => {
    prismaMock.loyaltyWallet.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue(null);
    const res = await get("no_such_restaurant", "browser_1");
    expect(res.status).toBe(404);
    expect(prismaMock.loyaltyWallet.create).not.toHaveBeenCalled();
  });

  it("rate-limits wallet creation per client IP", async () => {
    prismaMock.loyaltyWallet.findUnique.mockResolvedValue(null);
    prismaMock.restaurant.findUnique.mockResolvedValue({ id: "rest_rl" });
    prismaMock.loyaltyWallet.create.mockImplementation(async ({ data }: { data: { restaurantId: string; anonymousBrowserId: string } }) => ({
      id: "w",
      customerId: null,
      status: "ACTIVE",
      ...data,
      transactions: [],
      rewards: [],
    }));
    prismaMock.loyaltyProgram.findUnique.mockResolvedValue(null);

    const statuses: number[] = [];
    for (let i = 0; i < 61; i++) statuses.push((await get("rest_rl", `browser_${i}`)).status);
    expect(statuses.slice(0, 60).every((s) => s === 200)).toBe(true);
    expect(statuses[60]).toBe(429);
  });
});
