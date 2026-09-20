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

  it("identifies when a new milestone reward should unlock", () => {
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

    // Under threshold: 4 stamps
    const under = getNextUnlockedMilestone(4, milestones, []);
    expect(under).toBeNull();

    // Reached 5 stamps: unlocks m1
    const reached = getNextUnlockedMilestone(5, milestones, []);
    expect(reached?.id).toBe("m1");
    expect(reached?.rewardTitle).toBe("Free Drink");

    // Already unlocked m1, currently at 7 stamps: does not re-unlock m1
    const alreadyUnlocked = getNextUnlockedMilestone(7, milestones, [{ milestoneId: "m1" }]);
    expect(alreadyUnlocked).toBeNull();

    // Reached 10 stamps: unlocks m2
    const reachedSecond = getNextUnlockedMilestone(10, milestones, [{ milestoneId: "m1" }]);
    expect(reachedSecond?.id).toBe("m2");
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
});
