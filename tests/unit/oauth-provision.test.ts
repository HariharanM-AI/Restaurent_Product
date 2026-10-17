// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const tx = {
  user: { create: vi.fn() },
  restaurant: { create: vi.fn() },
  restaurantMember: { create: vi.fn() },
  guestAction: { createMany: vi.fn() },
  wifiConfig: { create: vi.fn() },
  loyaltyProgram: { create: vi.fn() },
  loyaltyMilestone: { createMany: vi.fn() },
};
const prismaMock = {
  user: { findUnique: vi.fn() },
  restaurant: { findUnique: vi.fn() },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx));
  tx.user.create.mockImplementation(async ({ data }) => ({ id: "u_new", ...data }));
  tx.restaurant.create.mockImplementation(async ({ data }) => ({ id: "r_new", ...data }));
  tx.loyaltyProgram.create.mockResolvedValue({ id: "lp_new" });
  prismaMock.restaurant.findUnique.mockResolvedValue(null);
});

describe("Google sign-in account provisioning", () => {
  it("signs an existing email straight into its account without creating anything", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u_existing" });
    const { findOrCreateOAuthUser } = await import("@/lib/auth/provision");

    await expect(findOrCreateOAuthUser("  Owner@Cafe.com ", "Owner")).resolves.toEqual({ id: "u_existing" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "owner@cafe.com" } }));
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("gives a first-time Google user a full starter venue and an unusable password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const { findOrCreateOAuthUser } = await import("@/lib/auth/provision");

    await expect(findOrCreateOAuthUser("new@cafe.com", "New Owner")).resolves.toEqual({ id: "u_new" });

    const created = tx.user.create.mock.calls[0][0].data;
    expect(created.email).toBe("new@cafe.com");
    // Random hash: no guessable password (e.g. empty string) can log in to a Google-only account
    expect(await bcrypt.compare("", created.passwordHash)).toBe(false);
    expect(tx.restaurantMember.create).toHaveBeenCalledWith({ data: { userId: "u_new", restaurantId: "r_new", role: "OWNER" } });
    expect(tx.loyaltyMilestone.createMany).toHaveBeenCalled();
    expect(tx.wifiConfig.create).toHaveBeenCalled();
  });
});
