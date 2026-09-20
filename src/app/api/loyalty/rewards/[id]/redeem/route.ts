import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rewardId } = await params;

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      include: {
        milestone: true,
      },
    });

    if (!reward) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Reward not found." } },
        { status: 404 }
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
      const red = await tx.loyaltyReward.update({
        where: { id: rewardId },
        data: {
          status: "REDEEMED",
          redeemedAt: new Date(),
        },
      });

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
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to redeem reward." } },
      { status: 500 }
    );
  }
}
