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
 * Milestones and their stamp requirements are defined specifically by the cafe admin.
 * A reward is unlocked ONLY when the customer has reached the exact stampRequirement set by the cafe.
 * Returns the unlocked milestone, or null.
 */
export function getNextUnlockedMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[],
  existingRewards: ExistingRewardLike[]
): MilestoneLike | null {
  const activeMilestones = (milestones || [])
    .filter((m) => m.enabled !== false)
    .sort((a, b) => a.stampRequirement - b.stampRequirement);

  if (activeMilestones.length === 0) {
    return null;
  }

  // The cycle length is defined by the cafe's maximum milestone requirement (minimum 10)
  const maxRequirement = Math.max(...activeMilestones.map((m) => m.stampRequirement), 10);
  const fullCycles = Math.floor(lifetimeStamps / maxRequirement);
  const remainder = lifetimeStamps % maxRequirement;

  for (const milestone of activeMilestones) {
    // A milestone is earnable once for every completed full cycle of the cafe's program,
    // plus once more if the current remainder has reached or exceeded its stampRequirement.
    const timesEarnable = fullCycles + (remainder >= milestone.stampRequirement ? 1 : 0);
    const timesUnlocked = existingRewards.filter((r) => r.milestoneId === milestone.id).length;

    if (timesEarnable > timesUnlocked) {
      return milestone;
    }
  }

  return null;
}

/**
 * Finds the upcoming milestone the customer is currently working towards based on the cafe's configured milestones.
 */
export function getUpcomingMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[]
): { nextMilestone: MilestoneLike | null; stampsNeeded: number } {
  const activeMilestones = (milestones || [])
    .filter((m) => m.enabled !== false)
    .sort((a, b) => a.stampRequirement - b.stampRequirement);

  if (activeMilestones.length === 0) {
    return { nextMilestone: null, stampsNeeded: 0 };
  }

  const maxRequirement = Math.max(...activeMilestones.map((m) => m.stampRequirement), 10);
  const currentCycle = Math.floor(lifetimeStamps / maxRequirement);
  const remainder = lifetimeStamps % maxRequirement;

  // Find the first milestone in the current cycle that has not yet been reached
  const upcomingInCycle = activeMilestones.find((m) => m.stampRequirement > remainder);

  if (upcomingInCycle) {
    const absoluteTarget = currentCycle * maxRequirement + upcomingInCycle.stampRequirement;
    return {
      nextMilestone: {
        ...upcomingInCycle,
        stampRequirement: absoluteTarget,
      },
      stampsNeeded: Math.max(0, absoluteTarget - lifetimeStamps),
    };
  }

  // If all milestones in this cycle were reached, point to the first milestone of the next cycle
  const firstMilestone = activeMilestones[0];
  const nextCycleTarget = (currentCycle + 1) * maxRequirement + firstMilestone.stampRequirement;
  return {
    nextMilestone: {
      ...firstMilestone,
      stampRequirement: nextCycleTarget,
    },
    stampsNeeded: Math.max(0, nextCycleTarget - lifetimeStamps),
  };
}
