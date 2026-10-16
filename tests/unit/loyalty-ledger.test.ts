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

  it("never unlocks 15-stamp reward when user is only at 5 stamps (custom venue milestones)", () => {
    const venueMilestones = [
      { id: "m1", stampRequirement: 5, rewardTitle: "Free Signature Beverage", validityDays: 30 },
      { id: "m2", stampRequirement: 10, rewardTitle: "Artisan Dessert on Us", validityDays: 45 },
      { id: "m3", stampRequirement: 15, rewardTitle: "Chef's Table Appetizer Board", validityDays: 60 },
    ];

    // At 5 stamps with no prior rewards: unlocks m1 ONLY
    const at5 = getNextUnlockedMilestone(5, venueMilestones, []);
    expect(at5?.id).toBe("m1");
    expect(at5?.stampRequirement).toBe(5);

    // At 5 stamps when m1 is already unlocked: does NOT unlock m2 or m3!
    const at5WithM1 = getNextUnlockedMilestone(5, venueMilestones, [{ milestoneId: "m1" }]);
    expect(at5WithM1).toBeNull();

    // At 14 stamps with m1 and m2 unlocked: does NOT unlock m3!
    const at14 = getNextUnlockedMilestone(14, venueMilestones, [{ milestoneId: "m1" }, { milestoneId: "m2" }]);
    expect(at14).toBeNull();

    // At 15 stamps: unlocks m3!
    const at15 = getNextUnlockedMilestone(15, venueMilestones, [{ milestoneId: "m1" }, { milestoneId: "m2" }]);
    expect(at15?.id).toBe("m3");
    expect(at15?.rewardTitle).toBe("Chef's Table Appetizer Board");
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
