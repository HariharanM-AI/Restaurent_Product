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
  // Sort milestones ascending by requirement
  const sorted = [...milestones].sort((a, b) => a.stampRequirement - b.stampRequirement);
  const unlockedMilestoneIds = new Set(existingRewards.map((r) => r.milestoneId));

  for (const milestone of sorted) {
    if (lifetimeStamps >= milestone.stampRequirement && !unlockedMilestoneIds.has(milestone.id)) {
      return milestone;
    }
  }

  return null;
}

/**
 * Finds the upcoming milestone the customer is currently working towards.
 */
export function getUpcomingMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[]
): { nextMilestone: MilestoneLike | null; stampsNeeded: number } {
  const sorted = [...milestones].sort((a, b) => a.stampRequirement - b.stampRequirement);
  for (const milestone of sorted) {
    if (lifetimeStamps < milestone.stampRequirement) {
      return {
        nextMilestone: milestone,
        stampsNeeded: milestone.stampRequirement - lifetimeStamps,
      };
    }
  }

  return { nextMilestone: null, stampsNeeded: 0 };
}
