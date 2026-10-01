import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

/**
 * GET /api/restaurants/[id]/dashboard?period=today|7d|30d|90d|1y|custom&from=ISO&to=ISO
 * Returns all dashboard metrics for the given restaurant, filtered by date range.
 * Queries are batched into small groups to avoid connection pool exhaustion.
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

    // Previous period for comparison (same duration, immediately before)
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodMs);
    const prevEndDate = startDate;

    const dateFilter = { gte: startDate, lte: endDate };
    const prevDateFilter = { gte: prevStartDate, lt: prevEndDate };

    // ── BATCH 1: Current period KPIs + Previous period KPIs (8 light count queries) ──
    const [
      currentVisits, currentStamps, currentFeedbacks, currentWallets,
      prevVisits, prevStamps, prevFeedbacks, prevWallets,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { restaurantId, eventType: "guest_page_view", createdAt: dateFilter } }),
      prisma.loyaltyStampTransaction.count({ where: { restaurantId, type: "STAMP_EARNED", createdAt: dateFilter } }),
      prisma.feedback.count({ where: { restaurantId, createdAt: dateFilter } }),
      prisma.loyaltyWallet.count({ where: { restaurantId, createdAt: dateFilter } }),
      prisma.analyticsEvent.count({ where: { restaurantId, eventType: "guest_page_view", createdAt: prevDateFilter } }),
      prisma.loyaltyStampTransaction.count({ where: { restaurantId, type: "STAMP_EARNED", createdAt: prevDateFilter } }),
      prisma.feedback.count({ where: { restaurantId, createdAt: prevDateFilter } }),
      prisma.loyaltyWallet.count({ where: { restaurantId, createdAt: prevDateFilter } }),
    ]);

    // ── BATCH 2: Heavy data queries (events, feedback distribution, loyalty) ──
    const [
      analyticsEvents,
      prevAnalyticsEvents,
      feedbacksByRating,
      avgRatingResult,
      totalActiveWallets,
      totalMilestonesUnlocked,
      totalRewardsRedeemed,
    ] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { restaurantId, createdAt: dateFilter },
        select: { eventType: true, createdAt: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { restaurantId, createdAt: prevDateFilter },
        select: { eventType: true, createdAt: true },
      }),
      prisma.feedback.groupBy({
        by: ["rating"],
        where: { restaurantId, createdAt: dateFilter },
        _count: { rating: true },
      }),
      prisma.feedback.aggregate({
        where: { restaurantId, createdAt: dateFilter },
        _avg: { rating: true },
      }),
      prisma.loyaltyWallet.count({ where: { restaurantId, status: "ACTIVE" } }),
      prisma.loyaltyStampTransaction.count({ where: { restaurantId, type: "MILESTONE_UNLOCKED", createdAt: dateFilter } }),
      prisma.loyaltyReward.count({ where: { restaurantId, status: "REDEEMED", redeemedAt: dateFilter } }),
    ]);

    // ── BATCH 3: Customer insights + Guest directory data ──
    const [
      allWallets,
      identifiedWallets,
      walletsWithMultipleStamps,
      guestDirectory,
    ] = await Promise.all([
      prisma.loyaltyWallet.count({ where: { restaurantId } }),
      prisma.loyaltyWallet.count({ where: { restaurantId, customerId: { not: null } } }),
      prisma.loyaltyWallet.count({
        where: {
          restaurantId,
          transactions: { some: { type: "STAMP_EARNED", createdAt: dateFilter } },
        },
      }),
      // Guest directory: recent wallets with transaction counts (for dashboard embed)
      prisma.loyaltyWallet.findMany({
        where: { restaurantId },
        select: {
          id: true,
          anonymousBrowserId: true,
          status: true,
          createdAt: true,
          customer: { select: { displayName: true, email: true, phone: true } },
          _count: { select: { transactions: true, rewards: true } },
          transactions: {
            where: { type: "STAMP_EARNED" },
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // --- Process Time-Series Data ---
    const timeSeriesMap = new Map<string, number>();
    const prevTimeSeriesMap = new Map<string, number>();

    for (const event of analyticsEvents) {
      const dayKey = event.createdAt.toISOString().split("T")[0];
      timeSeriesMap.set(dayKey, (timeSeriesMap.get(dayKey) || 0) + 1);
    }
    for (const event of prevAnalyticsEvents) {
      const dayKey = event.createdAt.toISOString().split("T")[0];
      prevTimeSeriesMap.set(dayKey, (prevTimeSeriesMap.get(dayKey) || 0) + 1);
    }

    const timeSeries: { date: string; current: number; previous: number }[] = [];
    const curDate = new Date(startDate);
    curDate.setUTCHours(0, 0, 0, 0);
    const finalDate = new Date(endDate);
    finalDate.setUTCHours(0, 0, 0, 0);

    const prevCurDate = new Date(prevStartDate);
    prevCurDate.setUTCHours(0, 0, 0, 0);

    while (curDate <= finalDate) {
      const dateKey = curDate.toISOString().split("T")[0];
      const prevDateKey = prevCurDate.toISOString().split("T")[0];

      timeSeries.push({
        date: dateKey,
        current: timeSeriesMap.get(dateKey) || 0,
        previous: prevTimeSeriesMap.get(prevDateKey) || 0,
      });

      curDate.setUTCDate(curDate.getUTCDate() + 1);
      prevCurDate.setUTCDate(prevCurDate.getUTCDate() + 1);
    }

    // --- Process Action Breakdown ---
    const actionCounts: Record<string, number> = {};
    for (const event of analyticsEvents) {
      actionCounts[event.eventType] = (actionCounts[event.eventType] || 0) + 1;
    }

    const totalActions = analyticsEvents.length || 1;
    const actionBreakdown = [
      { action: "Digital Menu", eventType: "menu_click", icon: "UtensilsCrossed", count: actionCounts["menu_click"] || 0 },
      { action: "Loyalty", eventType: "loyalty_open", icon: "Gift", count: actionCounts["loyalty_open"] || 0 },
      { action: "Wi-Fi Access", eventType: "wifi_open", icon: "Wifi", count: actionCounts["wifi_open"] || 0 },
      { action: "Google Review", eventType: "review_click", icon: "Star", count: actionCounts["review_click"] || 0 },
      { action: "Feedback", eventType: "feedback_submit", icon: "MessageSquare", count: actionCounts["feedback_submit"] || 0 },
      { action: "Social Links", eventType: "social_click", icon: "Share2", count: actionCounts["social_click"] || 0 },
    ].map((item) => ({
      ...item,
      percentage: Math.round((item.count / totalActions) * 100),
    })).sort((a, b) => b.count - a.count);

    // --- Process Peak Activity Heatmap ---
    const heatmapMatrix: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
    for (const event of analyticsEvents) {
      const d = event.createdAt;
      const hour = d.getUTCHours();
      const dayOfWeek = (d.getUTCDay() + 6) % 7;

      let timeSlot: number;
      if (hour >= 6 && hour < 12) timeSlot = 0;
      else if (hour >= 12 && hour < 16) timeSlot = 1;
      else if (hour >= 16 && hour < 20) timeSlot = 2;
      else timeSlot = 3;

      heatmapMatrix[timeSlot][dayOfWeek]++;
    }

    const maxHeat = Math.max(1, ...heatmapMatrix.flat());
    const normalizedHeatmap = heatmapMatrix.map((row) =>
      row.map((val) => Math.min(3, Math.round((val / maxHeat) * 3)))
    );

    // --- Feedback Distribution ---
    const feedbackDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const f of feedbacksByRating) {
      feedbackDist[f.rating] = f._count.rating;
    }
    const totalFeedbackCount = currentFeedbacks || 1;
    const feedbackDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: feedbackDist[stars] || 0,
      percentage: Math.round(((feedbackDist[stars] || 0) / totalFeedbackCount) * 100),
    }));

    // --- Review Journey Funnel ---
    const funnelStages = [
      { label: "Guest Interactions", count: actionCounts["guest_page_view"] || currentVisits },
      { label: "Prompt Viewed", count: actionCounts["review_prompt_view"] || 0 },
      { label: "Review Clicks", count: actionCounts["review_click"] || 0 },
      { label: "Feedback Given", count: currentFeedbacks },
    ];
    const funnelBase = funnelStages[0].count || 1;
    const funnel = funnelStages.map((s) => ({
      ...s,
      percentage: Math.round((s.count / funnelBase) * 100),
    }));

    // --- Customer Insights ---
    const anonymousWallets = allWallets - identifiedWallets;
    const returningPct = allWallets > 0
      ? Math.round((walletsWithMultipleStamps / allWallets) * 100 * 10) / 10
      : 0;
    const newGuestsPct = 100 - returningPct;

    // --- % Change Calculations ---
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    // --- Process Guest Directory for Dashboard ---
    const guests = guestDirectory.map((w) => ({
      id: w.id,
      name: w.customer?.displayName || `Guest ${w.anonymousBrowserId.slice(0, 6)}`,
      email: w.customer?.email || null,
      phone: w.customer?.phone || null,
      status: w.status,
      totalVisits: w._count.transactions,
      activeRewards: w._count.rewards,
      lastVisit: w.transactions[0]?.createdAt || w.createdAt,
      joinedAt: w.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        kpis: {
          visits: { current: currentVisits, previous: prevVisits, change: calcChange(currentVisits, prevVisits) },
          stamps: { current: currentStamps, previous: prevStamps, change: calcChange(currentStamps, prevStamps) },
          feedbacks: { current: currentFeedbacks, previous: prevFeedbacks, change: calcChange(currentFeedbacks, prevFeedbacks) },
          newCustomers: { current: currentWallets, previous: prevWallets, change: calcChange(currentWallets, prevWallets) },
          returningPct,
        },
        timeSeries,
        actionBreakdown,
        loyalty: {
          activeWallets: totalActiveWallets,
          stampsIssued: currentStamps,
          milestonesUnlocked: totalMilestonesUnlocked,
          rewardsRedeemed: totalRewardsRedeemed,
        },
        customerInsights: {
          totalGuests: allWallets,
          newGuestsPct,
          returningPct,
          identifiedGuests: identifiedWallets,
          anonymousGuests: anonymousWallets,
        },
        feedbackDistribution,
        averageRating: avgRatingResult._avg.rating
          ? Number(avgRatingResult._avg.rating.toFixed(1))
          : 0,
        positivePct: Math.round(
          ((feedbackDist[5] || 0) + (feedbackDist[4] || 0)) / totalFeedbackCount * 100
        ),
        heatmap: normalizedHeatmap,
        funnel,
        guests,
      },
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
