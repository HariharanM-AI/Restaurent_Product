// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const findFirst = vi.fn();
vi.mock("@/lib/db/prisma", () => ({ prisma: { feedback: { findFirst } } }));

const verifyRestaurantAccess = vi.fn();
vi.mock("@/lib/auth/session", () => ({ verifyRestaurantAccess }));

const download = vi.fn();
vi.mock("@/lib/supabase/storage", () => ({
  BUCKET_NAME: "restaurant-assets",
  getStorageClient: () => ({ storage: { from: () => ({ download }) } }),
}));

const get = async (restaurantId: string, feedbackId: string, index: string) => {
  const { GET } = await import("@/app/api/restaurants/[id]/feedback/[feedbackId]/photos/[index]/route");
  return GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ id: restaurantId, feedbackId, index }) });
};

beforeEach(() => {
  vi.clearAllMocks();
  download.mockResolvedValue({ data: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])]), error: null });
});

describe("Feedback photos are restaurant-private", () => {
  it("refuses anyone who isn't a member of the restaurant", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: false, error: "Access denied." });
    const res = await get("rest_A", "fb_1", "0");
    expect(res.status).toBe(403);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when an admin of restaurant A asks for restaurant B's feedback photo", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    findFirst.mockResolvedValue(null); // scoped lookup finds nothing for another tenant
    const res = await get("rest_A", "fb_of_B", "0");
    expect(res.status).toBe(404);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "fb_of_B", restaurantId: "rest_A" } }));
    expect(download).not.toHaveBeenCalled();
  });

  it("refuses a stored path that doesn't belong to the restaurant", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    findFirst.mockResolvedValue({ imagePaths: ["restaurants/rest_B/feedback/x.jpg"] });
    const res = await get("rest_A", "fb_1", "0");
    expect(res.status).toBe(404);
    expect(download).not.toHaveBeenCalled();
  });

  it("streams the photo to the restaurant's own admin with private caching", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    findFirst.mockResolvedValue({ imagePaths: ["restaurants/rest_A/feedback/abc.jpg"] });
    const res = await get("rest_A", "fb_1", "0");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toContain("private");
    expect(download).toHaveBeenCalledWith("restaurants/rest_A/feedback/abc.jpg");
  });

  it("rejects an out-of-range or non-numeric index", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER" });
    expect((await get("rest_A", "fb_1", "abc")).status).toBe(404);
    expect((await get("rest_A", "fb_1", "-1")).status).toBe(404);
  });
});
