import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

class RewardNotRedeemableError extends Error {}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rewardId } = await params;
    const body = await req.json().catch(() => null);
    const browserId = typeof body?.browserId === "string" ? body.browserId : "";
    if (!browserId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_FAILED", message: "browserId is required." } },
        { status: 400 }
      );
    }

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      include: {
        milestone: true,
        wallet: { select: { anonymousBrowserId: true } },
      },
    });

    // Only the guest whose wallet holds the reward can use it; anyone else gets the same 404 as a missing reward
    if (!reward || reward.wallet.anonymousBrowserId !== browserId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reward not found." } },
        { status: 404 }
      );
    }

    const now = new Date();

    if (reward.status === "AVAILABLE" && reward.expiresAt && reward.expiresAt <= now) {
      return NextResponse.json(
        { success: false, error: { code: "REWARD_EXPIRED", message: "This reward has expired." } },
        { status: 410 }
      );
    }

    if (reward.status !== "AVAILABLE") {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_REDEEMED", message: `Reward is already ${reward.status.toLowerCase()}.` } },
        { status: 400 }
      );
    }

    // Atomic update
    const updated = await prisma.$transaction(async (tx) => {
      // Atomic redeem: only an unexpired AVAILABLE reward can flip to REDEEMED, once
      const flipped = await tx.loyaltyReward.updateMany({
        where: {
          id: rewardId,
          status: "AVAILABLE",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          status: "REDEEMED",
          redeemedAt: now,
        },
      });
      if (flipped.count !== 1) {
        throw new RewardNotRedeemableError();
      }
      const red = await tx.loyaltyReward.findUniqueOrThrow({ where: { id: rewardId } });

      await tx.loyaltyStampTransaction.create({
        data: {
          restaurantId: reward.restaurantId,
          walletId: reward.walletId,
          type: "REWARD_REDEEMED",
          quantity: 0,
          rewardId: reward.id,
          idempotencyKey: `redeem_${reward.id}_${Date.now()}`,
        },
      });

      await tx.analyticsEvent.create({
        data: {
          restaurantId: reward.restaurantId,
          eventType: "loyalty_reward_redeemed",
          anonymousSessionId: "red_" + reward.walletId,
          metadata: JSON.stringify({ rewardTitle: reward.milestone.rewardTitle }),
        },
      });

      return red;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        redeemedAt: updated.redeemedAt,
      },
    });
  } catch (error) {
    if (error instanceof RewardNotRedeemableError) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_REDEEMED", message: "Reward is no longer available." } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to redeem reward." } },
      { status: 500 }
    );
  }
}
