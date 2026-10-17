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

type LevelLike = { stampRequirement: number; enabled?: boolean };

const activeSorted = <T extends LevelLike>(milestones: T[]) =>
  (milestones || []).filter((m) => m.enabled !== false).sort((a, b) => a.stampRequirement - b.stampRequirement);

/**
 * Returns the milestone unlocked by the stamp that brought the wallet to `lifetimeStamps`, or null.
 * Each admin-set level pays out ONCE, on the scan that lands exactly on it (5 → 5th stamp only, not 20th, 35th...).
 * Never "catches up" on stamps collected before a reward was created or its level was changed.
 */
export function getNextUnlockedMilestone(lifetimeStamps: number, milestones: MilestoneLike[]): MilestoneLike | null {
  if (lifetimeStamps <= 0) return null;
  return activeSorted(milestones).find((m) => m.stampRequirement === lifetimeStamps) ?? null;
}

/**
 * Finds the next admin-set level above the guest's lifetime stamps; null once every level is passed.
 */
export function getUpcomingMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[]
): { nextMilestone: MilestoneLike | null; stampsNeeded: number } {
  const upcoming = activeSorted(milestones).find((m) => m.stampRequirement > lifetimeStamps);
  return upcoming
    ? { nextMilestone: upcoming, stampsNeeded: upcoming.stampRequirement - lifetimeStamps }
    : { nextMilestone: null, stampsNeeded: 0 };
}
