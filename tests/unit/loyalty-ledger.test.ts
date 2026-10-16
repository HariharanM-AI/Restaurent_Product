import { describe, it, expect } from "vitest";
import {
  calculateWalletStamps,
  getCycleLength,
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

  it("unlocks a reward only on the scan that lands exactly on an admin-set level", () => {
    const milestones = [
      { id: "m1", stampRequirement: 5, rewardTitle: "Free Drink", validityDays: 30 },
      { id: "m2", stampRequirement: 10, rewardTitle: "Free Dessert", validityDays: 30 },
    ];

    expect(getNextUnlockedMilestone(4, milestones)).toBeNull();
    expect(getNextUnlockedMilestone(5, milestones)?.id).toBe("m1");
    expect(getNextUnlockedMilestone(6, milestones)).toBeNull(); // between levels: nothing
    expect(getNextUnlockedMilestone(7, milestones)).toBeNull();
    expect(getNextUnlockedMilestone(10, milestones)?.id).toBe("m2");
    // The card restarts after the highest level, so rewards repeat at the same levels
    expect(getNextUnlockedMilestone(11, milestones)).toBeNull();
    expect(getNextUnlockedMilestone(15, milestones)?.id).toBe("m1");
    expect(getNextUnlockedMilestone(20, milestones)?.id).toBe("m2");
  });

  it("never 'catches up' rewards for stamps collected before a level existed", () => {
    // Guest already had 12 stamps when the cafe created a 5-stamp reward (cycle = 5)
    const milestones = [{ id: "m1", stampRequirement: 5, rewardTitle: "Free Coffee", validityDays: 30 }];
    expect(getNextUnlockedMilestone(13, milestones)).toBeNull(); // 13th scan is not a level
    expect(getNextUnlockedMilestone(14, milestones)).toBeNull();
    expect(getNextUnlockedMilestone(15, milestones)?.id).toBe("m1"); // first real level hit
  });

  it("uses the cafe's own levels exactly, including a top level that isn't a multiple of 5 or 10", () => {
    const milestones = [
      { id: "a", stampRequirement: 3, rewardTitle: "Cookie", validityDays: 30 },
      { id: "b", stampRequirement: 7, rewardTitle: "Meal", validityDays: 30 },
    ];
    expect(getCycleLength(milestones)).toBe(7);
    const unlockedAt = Array.from({ length: 21 }, (_, i) => i + 1).filter((n) => getNextUnlockedMilestone(n, milestones));
    expect(unlockedAt).toEqual([3, 7, 10, 14, 17, 21]);
  });

  it("ignores disabled rewards and cafes with no rewards", () => {
    expect(getNextUnlockedMilestone(5, [])).toBeNull();
    expect(getCycleLength([])).toBe(0);
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

  it("calculates continuous upcoming milestones for consecutive cards (e.g. 12/15 and 16/20)", () => {
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

    // At 12 stamps: next reward is at 15 stamps, 3 needed (12/15)
    const at12 = getUpcomingMilestone(12, milestones);
    expect(at12.nextMilestone?.stampRequirement).toBe(15);
    expect(at12.stampsNeeded).toBe(3);

    // At 16 stamps: next reward is at 20 stamps, 4 needed (16/20)
    const at16 = getUpcomingMilestone(16, milestones);
    expect(at16.nextMilestone?.stampRequirement).toBe(20);
    expect(at16.stampsNeeded).toBe(4);

    // At 10 stamps (first 10 finished): next card cycle starts, reward target is 15 stamps, 5 needed
    const at10 = getUpcomingMilestone(10, milestones);
    expect(at10.nextMilestone?.stampRequirement).toBe(15);
    expect(at10.stampsNeeded).toBe(5);
  });
});
