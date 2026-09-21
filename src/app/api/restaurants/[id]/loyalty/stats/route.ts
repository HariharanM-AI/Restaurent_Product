import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

/**
 * GET /api/restaurants/[id]/loyalty/stats?period=today|7d|30d|90d|1y|custom&from=ISO&to=ISO
 * Returns all loyalty metrics for the given restaurant, filtered by date range.
 */
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

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "30d";
    const customFrom = url.searchParams.get("from");
    const customTo = url.searchParams.get("to");

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        startDate = customFrom ? new Date(customFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = customTo ? new Date(customTo) : now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const periodMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodMs);
    const prevEndDate = startDate;

    const dateFilter = { gte: startDate, lte: endDate };
    const prevDateFilter = { gte: prevStartDate, lt: prevEndDate };

    const [
      // Current period
      currentWallets,
      currentStamps,
      currentMilestones,
      currentRedeemed,
      totalRewardsUnlocked,
      // Previous period
      prevWallets,
      prevStamps,
      prevMilestones,
      prevRedeemed,
      // All-time totals
      totalWallets,
      totalStamps,
      totalRedeemed,
      // Stamp transactions for time-series
      stampTxns,
      // Recent transactions
      recentTxns,
      // Rewards by status
      availableRewards,
      expiredRewards,
    ] = await Promise.all([
      // Current period counts
      prisma.loyaltyWallet.count({
        where: { restaurantId, createdAt: dateFilter },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "STAMP_EARNED", createdAt: dateFilter },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "MILESTONE_UNLOCKED", createdAt: dateFilter },
      }),
      prisma.loyaltyReward.count({
        where: { restaurantId, status: "REDEEMED", redeemedAt: dateFilter },
      }),
      prisma.loyaltyReward.count({
        where: { restaurantId, unlockedAt: dateFilter },
      }),
      // Previous period
      prisma.loyaltyWallet.count({
        where: { restaurantId, createdAt: prevDateFilter },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "STAMP_EARNED", createdAt: prevDateFilter },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "MILESTONE_UNLOCKED", createdAt: prevDateFilter },
      }),
      prisma.loyaltyReward.count({
        where: { restaurantId, status: "REDEEMED", redeemedAt: prevDateFilter },
      }),
      // All-time totals
      prisma.loyaltyWallet.count({ where: { restaurantId } }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "STAMP_EARNED" },
      }),
      prisma.loyaltyReward.count({
        where: { restaurantId, status: "REDEEMED" },
      }),
      // Stamp transactions in current period for time-series chart
      prisma.loyaltyStampTransaction.findMany({
        where: { restaurantId, type: "STAMP_EARNED", createdAt: dateFilter },
        select: { createdAt: true },
      }),
      // Recent activity (last 10 transactions)
      prisma.loyaltyStampTransaction.findMany({
        where: { restaurantId },
        select: {
          id: true,
          type: true,
          quantity: true,
          createdAt: true,
          wallet: {
            select: {
              customer: {
                select: { displayName: true },
              },
              anonymousBrowserId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Reward statuses
      prisma.loyaltyReward.count({
        where: { restaurantId, status: "AVAILABLE" },
      }),
      prisma.loyaltyReward.count({
        where: { restaurantId, status: "EXPIRED" },
      }),
    ]);

    // Build time-series (daily stamp counts)
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil(periodMs / dayMs));
    const dayMap = new Map<string, number>();
    for (const txn of stampTxns) {
      const key = txn.createdAt.toISOString().split("T")[0];
      dayMap.set(key, (dayMap.get(key) || 0) + 1);
    }

    const timeSeries: { date: string; stamps: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const key = d.toISOString().split("T")[0];
      timeSeries.push({ date: key, stamps: dayMap.get(key) || 0 });
    }

    // Redemption rate
    const redemptionRate = totalRewardsUnlocked > 0
      ? Math.round((currentRedeemed / totalRewardsUnlocked) * 100 * 10) / 10
      : 0;

    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    // Recent activity feed
    const recentActivity = recentTxns.map((t) => ({
      id: t.id,
      type: t.type,
      quantity: t.quantity,
      customerName: t.wallet?.customer?.displayName || `Guest ${t.wallet?.anonymousBrowserId?.slice(0, 6) || "???"}`,
      createdAt: t.createdAt,
      description: txnTypeLabel(t.type, t.quantity),
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        kpis: {
          members: { current: currentWallets, total: totalWallets, change: calcChange(currentWallets, prevWallets) },
          stamps: { current: currentStamps, total: totalStamps, change: calcChange(currentStamps, prevStamps) },
          redeemed: { current: currentRedeemed, total: totalRedeemed, change: calcChange(currentRedeemed, prevRedeemed) },
          redemptionRate,
          milestones: { current: currentMilestones, change: calcChange(currentMilestones, prevMilestones) },
        },
        timeSeries,
        rewardStatus: {
          available: availableRewards,
          redeemed: totalRedeemed,
          expired: expiredRewards,
        },
        recentActivity,
      },
    });
  } catch (err) {
    console.error("Loyalty stats API error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch loyalty stats" }, { status: 500 });
  }
}

function txnTypeLabel(type: string, qty: number): string {
  switch (type) {
    case "STAMP_EARNED": return `Earned ${qty} stamp${qty > 1 ? "s" : ""}`;
    case "STAMP_REVERSED": return `${qty} stamp${qty > 1 ? "s" : ""} reversed`;
    case "MILESTONE_UNLOCKED": return "Milestone unlocked!";
    case "REWARD_REDEEMED": return "Reward redeemed";
    case "REWARD_EXPIRED": return "Reward expired";
    default: return type;
  }
}
