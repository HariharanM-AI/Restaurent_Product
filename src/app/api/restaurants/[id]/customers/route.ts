import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const access = await verifyRestaurantAccess(restaurantId);

    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    const [wallets, feedbacks] = await Promise.all([
      prisma.loyaltyWallet.findMany({
        where: { restaurantId },
        include: {
          customer: true,
          transactions: {
            orderBy: { createdAt: "desc" },
          },
          rewards: {
            include: {
              milestone: true,
            },
            orderBy: { unlockedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.feedback.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const customers = wallets.map((wallet) => {
      const stampsEarned = wallet.transactions.filter((t) => t.type === "STAMP_EARNED").length;
      const stampsRedeemed = wallet.transactions.filter((t) => t.type === "REWARD_REDEEMED").length;
      const netStamps = Math.max(0, stampsEarned - stampsRedeemed);
      const activeRewards = wallet.rewards.filter((r) => r.status === "AVAILABLE").length;
      const lastActivity = wallet.transactions[0]?.createdAt || wallet.createdAt;

      const guestFeedbacks = wallet.customer?.email
        ? feedbacks.filter((f) => f.contact && f.contact.toLowerCase() === wallet.customer?.email?.toLowerCase())
        : [];

      return {
        id: wallet.id,
        name: wallet.customer?.displayName || `Dining Guest #${wallet.anonymousBrowserId.slice(0, 6)}`,
        email: wallet.customer?.email || null,
        phone: wallet.customer?.phone || null,
        browserId: wallet.anonymousBrowserId,
        status: wallet.status || "ACTIVE",
        totalVisits: Math.max(1, stampsEarned),
        stampsBalance: netStamps,
        lifetimeStamps: stampsEarned,
        activeRewards,
        lastVisit: lastActivity,
        joinedAt: wallet.createdAt,
        transactions: wallet.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          quantity: t.quantity,
          createdAt: t.createdAt,
        })),
        rewards: wallet.rewards.map((r) => ({
          id: r.id,
          title: r.milestone?.rewardTitle || "Reward",
          status: r.status,
          unlockedAt: r.unlockedAt,
          redeemedAt: r.redeemedAt,
        })),
        feedbacks: guestFeedbacks.map((f) => ({
          id: f.id,
          rating: f.rating,
          message: f.message,
          createdAt: f.createdAt,
        })),
      };
    });

    return NextResponse.json({ success: true, data: customers });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
