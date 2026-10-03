export interface StampTransactionLike {
  type: string;
  quantity: number;
}

export interface MilestoneLike {
  id: string;
  stampRequirement: number;
  rewardTitle: string;
  rewardDescription?: string | null;
  validityDays: number;
  loyaltyProgramId?: string;
  enabled?: boolean;
  displayOrder?: number;
}

export interface ExistingRewardLike {
  milestoneId: string;
}

/**
 * Calculates current active stamp count and total lifetime stamps from transactions.
 */
export function calculateWalletStamps(transactions: StampTransactionLike[]): {
  currentStamps: number;
  lifetimeStamps: number;
} {
  let currentStamps = 0;
  let lifetimeStamps = 0;

  for (const txn of transactions) {
    if (txn.type === "STAMP_EARNED") {
      currentStamps += txn.quantity;
      lifetimeStamps += txn.quantity;
    } else if (txn.type === "STAMP_REVERSED") {
      currentStamps = Math.max(0, currentStamps - txn.quantity);
    }
  }

  return { currentStamps, lifetimeStamps };
}

/**
 * Evaluates whether a new milestone has been achieved that has not yet been unlocked for this wallet.
 * Returns the milestone if a reward should be issued, or null.
 */
export function getNextUnlockedMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[],
  existingRewards: ExistingRewardLike[]
): MilestoneLike | null {
  const sorted = [...milestones].sort((a, b) => a.stampRequirement - b.stampRequirement);

  for (const milestone of sorted) {
    const reqInCycle = ((milestone.stampRequirement - 1) % 10) + 1;
    const timesEarnable =
      lifetimeStamps >= reqInCycle
        ? Math.floor((lifetimeStamps - reqInCycle) / 10) + 1
        : 0;
    const timesUnlocked = existingRewards.filter((r) => r.milestoneId === milestone.id).length;

    if (timesEarnable > timesUnlocked) {
      return milestone;
    }
  }

  return null;
}

/**
 * Finds the upcoming milestone the customer is currently working towards in the active 10-stamp card cycle.
 */
export function getUpcomingMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[]
): { nextMilestone: MilestoneLike | null; stampsNeeded: number } {
  if (!milestones || milestones.length === 0) {
    return { nextMilestone: null, stampsNeeded: 0 };
  }

  const sorted = [...milestones].sort((a, b) => a.stampRequirement - b.stampRequirement);
  const currentInCycle = lifetimeStamps % 10;

  for (const milestone of sorted) {
    const reqInCycle = ((milestone.stampRequirement - 1) % 10) + 1;
    if (currentInCycle < reqInCycle) {
      return {
        nextMilestone: milestone,
        stampsNeeded: reqInCycle - currentInCycle,
      };
    }
  }

  // If all milestones in this 10-stamp card cycle are reached, point to the first milestone of the next cycle
  const firstMilestone = sorted[0];
  const firstReq = ((firstMilestone.stampRequirement - 1) % 10) + 1;
  const stampsToCycleEnd = 10 - currentInCycle;
  return {
    nextMilestone: firstMilestone,
    stampsNeeded: stampsToCycleEnd + firstReq,
  };
}
