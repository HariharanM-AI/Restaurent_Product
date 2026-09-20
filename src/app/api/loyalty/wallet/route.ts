import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateWalletStamps, getUpcomingMilestone } from "@/lib/loyalty/ledger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const browserId = searchParams.get("browserId");

    if (!restaurantId || !browserId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "restaurantId and browserId are required" } },
        { status: 400 }
      );
    }

    // 1. Find or create the anonymous wallet
    let wallet = await prisma.loyaltyWallet.findUnique({
      where: {
        restaurantId_anonymousBrowserId: {
          restaurantId,
          anonymousBrowserId: browserId,
        },
      },
      include: {
        transactions: {
          orderBy: { createdAt: "asc" },
        },
        rewards: {
          include: {
            milestone: true,
          },
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.loyaltyWallet.create({
        data: {
          restaurantId,
          anonymousBrowserId: browserId,
        },
        include: {
          transactions: true,
          rewards: {
            include: {
              milestone: true,
            },
          },
        },
      });
    }

    // 2. Compute net stamps from transactions ledger
    const { currentStamps, lifetimeStamps } = calculateWalletStamps(wallet.transactions);

    // 3. Fetch active milestones for this restaurant
    const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
      where: { restaurantId },
      include: {
        milestones: {
          where: { enabled: true },
          orderBy: { stampRequirement: "asc" },
        },
      },
    });

    const milestones = loyaltyProgram?.milestones || [];
    const { nextMilestone, stampsNeeded } = getUpcomingMilestone(lifetimeStamps, milestones);

    return NextResponse.json({
      success: true,
      data: {
        id: wallet.id,
        restaurantId: wallet.restaurantId,
        customerId: wallet.customerId,
        anonymousBrowserId: wallet.anonymousBrowserId,
        status: wallet.status,
        currentStamps,
        totalLifetimeStamps: lifetimeStamps,
        unlockedRewards: wallet.rewards.map((r) => ({
          id: r.id,
          restaurantId: r.restaurantId,
          walletId: r.walletId,
          milestoneId: r.milestoneId,
          rewardTitle: r.milestone.rewardTitle,
          rewardDescription: r.milestone.rewardDescription,
          status: r.status,
          unlockedAt: r.unlockedAt,
          redeemedAt: r.redeemedAt,
          expiresAt: r.expiresAt,
        })),
        nextMilestone: nextMilestone
          ? {
              id: nextMilestone.id,
              loyaltyProgramId: nextMilestone.loyaltyProgramId || "",
              stampRequirement: nextMilestone.stampRequirement,
              rewardTitle: nextMilestone.rewardTitle,
              rewardDescription: nextMilestone.rewardDescription,
              validityDays: nextMilestone.validityDays,
              enabled: nextMilestone.enabled ?? true,
              displayOrder: nextMilestone.displayOrder ?? 0,
            }
          : null,
        stampsNeededForNext: stampsNeeded,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to retrieve loyalty wallet" } },
      { status: 500 }
    );
  }
}
