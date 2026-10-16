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
 * One stamp-card cycle is exactly the cafe's highest reward level (0 when the cafe has no rewards).
 * The card restarts after that, so rewards repeat at the same admin-set levels every cycle.
 */
export function getCycleLength(milestones: LevelLike[]): number {
  const active = activeSorted(milestones);
  return active.length ? Math.max(...active.map((m) => m.stampRequirement)) : 0;
}

/**
 * Returns the milestone unlocked by the stamp that brought the wallet to `lifetimeStamps`, or null.
 * A reward unlocks ONLY on the scan that lands exactly on an admin-set level — never by "catching up"
 * on stamps collected before a reward was created or its level was changed.
 */
export function getNextUnlockedMilestone(lifetimeStamps: number, milestones: MilestoneLike[]): MilestoneLike | null {
  const cycle = getCycleLength(milestones);
  if (cycle === 0 || lifetimeStamps <= 0) return null;
  const positionInCycle = ((lifetimeStamps - 1) % cycle) + 1;
  return activeSorted(milestones).find((m) => m.stampRequirement === positionInCycle) ?? null;
}

/**
 * Finds the upcoming milestone the customer is working towards, as an absolute lifetime stamp target.
 */
export function getUpcomingMilestone(
  lifetimeStamps: number,
  milestones: MilestoneLike[]
): { nextMilestone: MilestoneLike | null; stampsNeeded: number } {
  const cycle = getCycleLength(milestones);
  if (cycle === 0) return { nextMilestone: null, stampsNeeded: 0 };

  const cycleStart = Math.floor(lifetimeStamps / cycle) * cycle;
  // Always found: the highest level equals the cycle length, which is > the position in the cycle
  const upcoming = activeSorted(milestones).find((m) => cycleStart + m.stampRequirement > lifetimeStamps)!;
  const target = cycleStart + upcoming.stampRequirement;
  return {
    nextMilestone: { ...upcoming, stampRequirement: target },
    stampsNeeded: target - lifetimeStamps,
  };
}
