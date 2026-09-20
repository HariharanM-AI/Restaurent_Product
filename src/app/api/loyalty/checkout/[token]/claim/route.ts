import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/loyalty/token";
import { calculateWalletStamps, getNextUnlockedMilestone } from "@/lib/loyalty/ledger";
import { claimLoyaltyTokenSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const body = await req.json();

    const parsed = claimLoyaltyTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_FAILED", message: "Invalid request payload." } },
        { status: 400 }
      );
    }

    const { anonymousBrowserId, customerContact, idempotencyKey } = parsed.data;
    const tokenHash = hashToken(rawToken);

    // 1. Locate the checkout session by token hash
    const session = await prisma.loyaltyCheckoutSession.findUnique({
      where: { tokenHash },
      include: {
        restaurant: {
          include: {
            loyaltyProgram: {
              include: {
                milestones: {
                  where: { enabled: true },
                  orderBy: { stampRequirement: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "Invalid or unrecognized checkout loyalty token." } },
        { status: 404 }
      );
    }

    if (session.status === "CONSUMED") {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_CONSUMED", message: "This checkout QR code has already been claimed." } },
        { status: 409 }
      );
    }

    if (session.status !== "ACTIVE" || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "EXPIRED_TOKEN", message: "This checkout QR code has expired. Please ask staff for a fresh code." } },
        { status: 410 }
      );
    }

    const restaurantId = session.restaurantId;

    // 2. Atomic Database Transaction to Consume Token & Award Stamp
    const result = await prisma.$transaction(async (tx) => {
      // Mark session consumed
      await tx.loyaltyCheckoutSession.update({
        where: { id: session.id },
        data: {
          status: "CONSUMED",
          consumedAt: new Date(),
        },
      });

      // Find or create wallet
      let wallet = await tx.loyaltyWallet.findUnique({
        where: {
          restaurantId_anonymousBrowserId: {
            restaurantId,
            anonymousBrowserId,
          },
        },
        include: {
          transactions: true,
          rewards: true,
        },
      });

      if (!wallet) {
        wallet = await tx.loyaltyWallet.create({
          data: {
            restaurantId,
            anonymousBrowserId,
          },
          include: {
            transactions: true,
            rewards: true,
          },
        });
      }

      // Record transaction with idempotency key
      const txn = await tx.loyaltyStampTransaction.create({
        data: {
          restaurantId,
          walletId: wallet.id,
          type: "STAMP_EARNED",
          quantity: 1,
          checkoutSessionId: session.id,
          idempotencyKey,
          metadata: customerContact ? JSON.stringify({ contact: customerContact }) : null,
        },
      });

      // Recalculate lifetime stamps
      const allTxns = [...wallet.transactions, txn];
      const { currentStamps, lifetimeStamps } = calculateWalletStamps(allTxns);

      // Check if milestone unlocked
      const milestones = session.restaurant.loyaltyProgram?.milestones || [];
      const newMilestone = getNextUnlockedMilestone(lifetimeStamps, milestones, wallet.rewards);

      let newReward = null;
      if (newMilestone) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + newMilestone.validityDays);

        newReward = await tx.loyaltyReward.create({
          data: {
            restaurantId,
            walletId: wallet.id,
            milestoneId: newMilestone.id,
            status: "AVAILABLE",
            unlockedAt: new Date(),
            expiresAt,
          },
          include: {
            milestone: true,
          },
        });

        // Record milestone unlocked transaction
        await tx.loyaltyStampTransaction.create({
          data: {
            restaurantId,
            walletId: wallet.id,
            type: "MILESTONE_UNLOCKED",
            quantity: 0,
            milestoneId: newMilestone.id,
            rewardId: newReward.id,
            idempotencyKey: `milestone_${newMilestone.id}_${wallet.id}_${Date.now()}`,
          },
        });
      }

      // Record telemetry
      await tx.analyticsEvent.create({
        data: {
          restaurantId,
          eventType: "loyalty_stamp_earned",
          anonymousSessionId: "claim_" + wallet.id,
          metadata: JSON.stringify({
            currentStamps,
            lifetimeStamps,
            rewardUnlocked: Boolean(newReward),
          }),
        },
      });

      return {
        walletId: wallet.id,
        currentStamps,
        lifetimeStamps,
        newReward: newReward
          ? {
              id: newReward.id,
              rewardTitle: newReward.milestone.rewardTitle,
              rewardDescription: newReward.milestone.rewardDescription,
              expiresAt: newReward.expiresAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        restaurantName: session.restaurant.name,
        restaurantSlug: session.restaurant.slug,
        primaryColor: session.restaurant.primaryColor,
        stampEarned: 1,
        currentStamps: result.currentStamps,
        lifetimeStamps: result.lifetimeStamps,
        newReward: result.newReward,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      // Unique constraint violation on idempotencyKey or tokenHash
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_CLAIM", message: "This stamp has already been recorded." } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to process stamp claim." } },
      { status: 500 }
    );
  }
}
