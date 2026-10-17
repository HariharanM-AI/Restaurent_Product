import { describe, it, expect } from "vitest";
import {
  calculateWalletStamps,
  getNextUnlockedMilestone,
  getUpcomingMilestone,
} from "@/lib/loyalty/ledger";

describe("Loyalty Ledger Engine", () => {
  it("calculates active and lifetime stamps correctly", () => {
    const transactions = [
      { type: "STAMP_EARNED", quantity: 1 },
      { type: "STAMP_EARNED", quantity: 1 },
      { type: "STAMP_EARNED", quantity: 1 },
      { type: "STAMP_REVERSED", quantity: 1 }, // staff reversed an erroneous stamp
      { type: "STAMP_EARNED", quantity: 1 },
    ];

    const { currentStamps, lifetimeStamps } = calculateWalletStamps(transactions);
    expect(currentStamps).toBe(3); // 1 + 1 + 1 - 1 + 1 = 3
    expect(lifetimeStamps).toBe(4); // 4 stamps earned in total
  });

  it("unlocks each admin-set level once, on the exact stamp, never repeating", () => {
    const milestones = [
      { id: "m5", stampRequirement: 5, rewardTitle: "Free Drink", validityDays: 30 },
      { id: "m10", stampRequirement: 10, rewardTitle: "Free Dessert", validityDays: 30 },
      { id: "m15", stampRequirement: 15, rewardTitle: "Free Meal", validityDays: 30 },
    ];
    const unlockedAt = Array.from({ length: 60 }, (_, i) => i + 1).filter((n) => getNextUnlockedMilestone(n, milestones));
    expect(unlockedAt).toEqual([5, 10, 15]); // not 20, 25, 30, 35...
    expect(getNextUnlockedMilestone(10, milestones)?.id).toBe("m10");
  });

  it("never 'catches up' rewards for stamps collected before a level existed", () => {
    // Guest already had 12 stamps when the cafe created 5- and 15-stamp rewards
    const milestones = [
      { id: "m5", stampRequirement: 5, rewardTitle: "Free Coffee", validityDays: 30 },
      { id: "m15", stampRequirement: 15, rewardTitle: "Free Meal", validityDays: 30 },
    ];
    expect(getNextUnlockedMilestone(13, milestones)).toBeNull();
    expect(getNextUnlockedMilestone(15, milestones)?.id).toBe("m15"); // 5 was already passed: no back-pay
  });

  it("uses the cafe's own levels exactly, even ones that aren't multiples of 5", () => {
    const milestones = [
      { id: "a", stampRequirement: 3, rewardTitle: "Cookie", validityDays: 30 },
      { id: "b", stampRequirement: 7, rewardTitle: "Meal", validityDays: 30 },
    ];
    const unlockedAt = Array.from({ length: 21 }, (_, i) => i + 1).filter((n) => getNextUnlockedMilestone(n, milestones));
    expect(unlockedAt).toEqual([3, 7]);
  });

  it("ignores disabled rewards and cafes with no rewards", () => {
    expect(getNextUnlockedMilestone(5, [])).toBeNull();
    expect(getUpcomingMilestone(5, [])).toEqual({ nextMilestone: null, stampsNeeded: 0 });
    const milestones = [
      { id: "on", stampRequirement: 4, rewardTitle: "On", validityDays: 30 },
      { id: "off", stampRequirement: 2, rewardTitle: "Off", validityDays: 30, enabled: false },
    ];
    expect(getNextUnlockedMilestone(2, milestones)).toBeNull();
    expect(getNextUnlockedMilestone(4, milestones)?.id).toBe("on");
  });

  it("calculates upcoming milestone and visits needed", () => {
    const milestones = [
      {
        id: "m1",
        stampRequirement: 5,
        rewardTitle: "Free Drink",
        validityDays: 30,
      },
      {
        id: "m2",
        stampRequirement: 10,
        rewardTitle: "Free Dessert",
        validityDays: 30,
      },
    ];

    const { nextMilestone, stampsNeeded } = getUpcomingMilestone(3, milestones);
    expect(nextMilestone?.id).toBe("m1");
    expect(stampsNeeded).toBe(2); // 5 - 3 = 2 more stamps needed
  });

  it("points at the next admin-set level, and at nothing once every level is passed", () => {
    const milestones = [
      { id: "m1", stampRequirement: 5, rewardTitle: "Free Drink", validityDays: 30 },
      { id: "m2", stampRequirement: 10, rewardTitle: "Free Dessert", validityDays: 30 },
    ];
    expect(getUpcomingMilestone(5, milestones)).toMatchObject({ nextMilestone: { id: "m2", stampRequirement: 10 }, stampsNeeded: 5 });
    expect(getUpcomingMilestone(10, milestones)).toEqual({ nextMilestone: null, stampsNeeded: 0 });
    expect(getUpcomingMilestone(31, milestones)).toEqual({ nextMilestone: null, stampsNeeded: 0 });
  });
});
