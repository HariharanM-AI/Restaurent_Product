// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/* ─── Mocks: no real database or session is touched ─── */
const prismaMock = {
  loyaltyMilestone: {
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
  },
  loyaltyReward: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  loyaltyStampTransaction: { create: vi.fn() },
  analyticsEvent: { create: vi.fn() },
  loyaltyCheckoutSession: { findUnique: vi.fn(), updateMany: vi.fn() },
  loyaltyWallet: { findUnique: vi.fn(), create: vi.fn() },
  restaurant: { findUnique: vi.fn() },
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prismaMock)),
};

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

const verifyRestaurantAccess = vi.fn();
vi.mock("@/lib/auth/session", () => ({ verifyRestaurantAccess }));

const json = (body: unknown) =>
  new NextRequest("http://localhost/api/test", { method: "PATCH", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(prismaMock));
});

describe("Loyalty milestones are tenant-scoped", () => {
  it("returns 404 when an owner of restaurant A edits a milestone that belongs to restaurant B", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER", restaurantId: "rest_A" });
    prismaMock.loyaltyMilestone.updateMany.mockResolvedValue({ count: 0 });

    const { PATCH } = await import("@/app/api/restaurants/[id]/loyalty/milestones/[milestoneId]/route");
    const res = await PATCH(json({ rewardTitle: "Hijacked reward" }), {
      params: Promise.resolve({ id: "rest_A", milestoneId: "milestone_of_B" }),
    });

    expect(res.status).toBe(404);
    expect(prismaMock.loyaltyMilestone.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "milestone_of_B", loyaltyProgram: { restaurantId: "rest_A" } } })
    );
  });

  it("returns 404 when an owner of restaurant A deletes a milestone that belongs to restaurant B", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER", restaurantId: "rest_A" });
    prismaMock.loyaltyMilestone.deleteMany.mockResolvedValue({ count: 0 });

    const { DELETE } = await import("@/app/api/restaurants/[id]/loyalty/milestones/[milestoneId]/route");
    const res = await DELETE(json({}), { params: Promise.resolve({ id: "rest_A", milestoneId: "milestone_of_B" }) });

    expect(res.status).toBe(404);
    expect(prismaMock.loyaltyMilestone.deleteMany).toHaveBeenCalledWith({
      where: { id: "milestone_of_B", loyaltyProgram: { restaurantId: "rest_A" } },
    });
  });

  it("still updates a milestone that belongs to the caller's restaurant", async () => {
    verifyRestaurantAccess.mockResolvedValue({ authorized: true, role: "OWNER", restaurantId: "rest_A" });
    prismaMock.loyaltyMilestone.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.loyaltyMilestone.findUnique.mockResolvedValue({ id: "m1", rewardTitle: "Free coffee" });

    const { PATCH } = await import("@/app/api/restaurants/[id]/loyalty/milestones/[milestoneId]/route");
    const res = await PATCH(json({ rewardTitle: "Free coffee" }), {
      params: Promise.resolve({ id: "rest_A", milestoneId: "m1" }),
    });

    expect(res.status).toBe(200);
  });
});

describe("Single-use checkout QR cannot be double-claimed", () => {
  it("returns 409 when a concurrent claim already consumed the token", async () => {
    prismaMock.loyaltyCheckoutSession.findUnique.mockResolvedValue({
      id: "sess_1",
      restaurantId: "rest_A",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 60_000),
      restaurant: { name: "R", slug: "r", primaryColor: "#000", loyaltyProgram: { milestones: [] } },
    });
    // The other request won the race: the conditional update matches nothing
    prismaMock.loyaltyCheckoutSession.updateMany.mockResolvedValue({ count: 0 });

    const { POST } = await import("@/app/api/loyalty/checkout/[token]/claim/route");
    const req = new NextRequest("http://localhost/api/claim", {
      method: "POST",
      body: JSON.stringify({ anonymousBrowserId: "wal_test_browser_1", idempotencyKey: "idem_key_123456" }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: "tok" }) });

    expect(res.status).toBe(409);
    expect(prismaMock.loyaltyStampTransaction.create).not.toHaveBeenCalled();
  });
});

describe("Stamps are venue-specific", () => {
  it("rejects another venue's checkout QR without consuming it", async () => {
    prismaMock.loyaltyCheckoutSession.findUnique.mockResolvedValue({
      id: "sess_B",
      restaurantId: "rest_B",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 60_000),
      restaurant: { name: "Cafe B", slug: "b", primaryColor: "#000", loyaltyProgram: { milestones: [] } },
    });
    prismaMock.restaurant.findUnique.mockResolvedValue({ name: "Cafe A" });

    const { POST } = await import("@/app/api/loyalty/checkout/[token]/claim/route");
    const req = new NextRequest("http://localhost/api/claim", {
      method: "POST",
      body: JSON.stringify({ anonymousBrowserId: "wal_test_browser_1", idempotencyKey: "idem_key_123456", expectedRestaurantId: "rest_A" }),
    });
    const res = await POST(req, { params: Promise.resolve({ token: "tok" }) });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("CAFE_MISMATCH");
    expect(prismaMock.loyaltyCheckoutSession.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.loyaltyStampTransaction.create).not.toHaveBeenCalled();
  });
});

describe("Reward redemption", () => {
  const params = { params: Promise.resolve({ id: "reward_1" }) };
  const post = (browserId: string | null = "wal_owner") =>
    new NextRequest("http://localhost/api/redeem", {
      method: "POST",
      body: browserId === null ? undefined : JSON.stringify({ browserId }),
    });
  const ownersWallet = { anonymousBrowserId: "wal_owner" };

  it("only the guest whose wallet holds the reward can redeem it", async () => {
    prismaMock.loyaltyReward.findUnique.mockResolvedValue({
      id: "reward_1",
      status: "AVAILABLE",
      expiresAt: new Date(Date.now() + 60_000),
      milestone: { rewardTitle: "Dessert" },
      wallet: ownersWallet,
    });

    const { POST } = await import("@/app/api/loyalty/rewards/[id]/redeem/route");
    const someoneElse = await POST(post("wal_someone_else"), params);
    const noId = await POST(post(null), params);

    expect(someoneElse.status).toBe(404); // same answer as a reward that doesn't exist
    expect(noId.status).toBe(400);
    expect(prismaMock.loyaltyReward.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an expired reward with 410", async () => {
    prismaMock.loyaltyReward.findUnique.mockResolvedValue({
      id: "reward_1",
      status: "AVAILABLE",
      expiresAt: new Date(Date.now() - 1000),
      milestone: { rewardTitle: "Dessert" },
      wallet: ownersWallet,
    });

    const { POST } = await import("@/app/api/loyalty/rewards/[id]/redeem/route");
    const res = await POST(post(), params);

    expect(res.status).toBe(410);
    expect(prismaMock.loyaltyReward.updateMany).not.toHaveBeenCalled();
  });

  it("returns 409 when a concurrent request already redeemed it", async () => {
    prismaMock.loyaltyReward.findUnique.mockResolvedValue({
      id: "reward_1",
      status: "AVAILABLE",
      expiresAt: new Date(Date.now() + 60_000),
      milestone: { rewardTitle: "Dessert" },
      wallet: ownersWallet,
    });
    prismaMock.loyaltyReward.updateMany.mockResolvedValue({ count: 0 });

    const { POST } = await import("@/app/api/loyalty/rewards/[id]/redeem/route");
    const res = await POST(post(), params);

    expect(res.status).toBe(409);
    expect(prismaMock.loyaltyStampTransaction.create).not.toHaveBeenCalled();
  });
});

describe("getClientIp", () => {
  it("prefers platform-set headers over a spoofable X-Forwarded-For", async () => {
    const { getClientIp } = await import("@/lib/client-ip");
    const h = new Headers({ "x-forwarded-for": "6.6.6.6, 10.0.0.1", "x-real-ip": "203.0.113.7" });
    expect(getClientIp(h)).toBe("203.0.113.7");
    expect(getClientIp(new Headers({ "x-nf-client-connection-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(getClientIp({ "x-forwarded-for": "192.0.2.1, 10.0.0.1" })).toBe("192.0.2.1");
    expect(getClientIp(undefined)).toBe("unknown");
  });
});
