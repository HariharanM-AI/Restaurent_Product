import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

/**
 * GET /api/restaurants/[id]/dashboard?period=today|7d|30d|90d|1y|custom&from=ISO&to=ISO
 * Returns all dashboard metrics for the given restaurant, filtered by date range.
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

    // Run ALL queries in parallel for maximum performance
    const [
      // Current period KPIs
      currentVisits,
      currentStamps,
      currentFeedbacks,
      currentWallets,
      // Previous period KPIs for comparison
      prevVisits,
      prevStamps,
      prevFeedbacks,
      prevWallets,
      // Analytics events for time-series + action breakdown + heatmap
      analyticsEvents,
      // Previous period events for chart comparison
      prevAnalyticsEvents,
      // Feedback star distribution
      feedbacksByRating,
      // Average rating
      avgRatingResult,
      // Loyalty stats
      totalActiveWallets,
      totalMilestonesUnlocked,
      totalRewardsRedeemed,
      // Customer insights: total wallets, identified (with customerId)
      allWallets,
      identifiedWallets,
      // Recent activity: last 8 events
      recentEvents,
      // Recent feedbacks
      recentFeedbacks,
      // Recent stamp transactions
      recentStamps,
      // Returning guests (wallets with >1 stamp txn in period)
      walletsWithMultipleStamps,
    ] = await Promise.all([
      // Current period counts
      prisma.analyticsEvent.count({
        where: { restaurantId, eventType: "guest_page_view", createdAt: dateFilter },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "STAMP_EARNED", createdAt: dateFilter },
      }),
      prisma.feedback.count({
        where: { restaurantId, createdAt: dateFilter },
      }),
      prisma.loyaltyWallet.count({
        where: { restaurantId, createdAt: dateFilter },
      }),
      // Previous period counts
      prisma.analyticsEvent.count({
        where: { restaurantId, eventType: "guest_page_view", createdAt: prevDateFilter },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "STAMP_EARNED", createdAt: prevDateFilter },
      }),
      prisma.feedback.count({
        where: { restaurantId, createdAt: prevDateFilter },
      }),
      prisma.loyaltyWallet.count({
        where: { restaurantId, createdAt: prevDateFilter },
      }),
      // All analytics events in current period (for time-series, action breakdown, heatmap)
      prisma.analyticsEvent.findMany({
        where: { restaurantId, createdAt: dateFilter },
        select: { eventType: true, createdAt: true },
      }),
      // Previous period events for chart overlay
      prisma.analyticsEvent.findMany({
        where: { restaurantId, createdAt: prevDateFilter },
        select: { eventType: true, createdAt: true },
      }),
      // Feedback star distribution (all-time for current period)
      prisma.feedback.groupBy({
        by: ["rating"],
        where: { restaurantId, createdAt: dateFilter },
        _count: { rating: true },
      }),
      // Average rating
      prisma.feedback.aggregate({
        where: { restaurantId, createdAt: dateFilter },
        _avg: { rating: true },
      }),
      // Loyalty stats
      prisma.loyaltyWallet.count({
        where: { restaurantId, status: "ACTIVE" },
      }),
      prisma.loyaltyStampTransaction.count({
        where: { restaurantId, type: "MILESTONE_UNLOCKED", createdAt: dateFilter },
      }),
      prisma.loyaltyReward.count({
        where: { restaurantId, status: "REDEEMED", redeemedAt: dateFilter },
      }),
      // Customer insights
      prisma.loyaltyWallet.count({
        where: { restaurantId },
      }),
      prisma.loyaltyWallet.count({
        where: { restaurantId, customerId: { not: null } },
      }),
      // Recent events (last 8)
      prisma.analyticsEvent.findMany({
        where: { restaurantId },
        select: { eventType: true, createdAt: true, anonymousSessionId: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      // Recent feedbacks (last 5)
      prisma.feedback.findMany({
        where: { restaurantId },
        select: { rating: true, message: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent stamp transactions
      prisma.loyaltyStampTransaction.findMany({
        where: { restaurantId },
        select: { type: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Returning guests: wallets that have more than 1 stamp txn in the period
      prisma.loyaltyWallet.count({
        where: {
          restaurantId,
          transactions: {
            some: {
              type: "STAMP_EARNED",
              createdAt: dateFilter,
            },
          },
        },
      }),
    ]);

    // --- Process Time-Series Data ---
    const timeSeriesMap = new Map<string, number>();
    const prevTimeSeriesMap = new Map<string, number>();

    // Determine bucket size based on period
    for (const event of analyticsEvents) {
      const dayKey = event.createdAt.toISOString().split("T")[0];
      timeSeriesMap.set(dayKey, (timeSeriesMap.get(dayKey) || 0) + 1);
    }

    for (const event of prevAnalyticsEvents) {
      const dayKey = event.createdAt.toISOString().split("T")[0];
      prevTimeSeriesMap.set(dayKey, (prevTimeSeriesMap.get(dayKey) || 0) + 1);
    }

    // Generate all dates in range
    const timeSeries: { date: string; current: number; previous: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.ceil(periodMs / dayMs);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const dateKey = d.toISOString().split("T")[0];
      const prevD = new Date(prevStartDate.getTime() + i * dayMs);
      const prevDateKey = prevD.toISOString().split("T")[0];

      timeSeries.push({
        date: dateKey,
        current: timeSeriesMap.get(dateKey) || 0,
        previous: prevTimeSeriesMap.get(prevDateKey) || 0,
      });
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
    // Matrix: 4 time slots × 7 days (Mon-Sun)
    const heatmapMatrix: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
    for (const event of analyticsEvents) {
      const d = event.createdAt;
      const hour = d.getUTCHours();
      const dayOfWeek = (d.getUTCDay() + 6) % 7; // Mon=0, Sun=6

      let timeSlot: number;
      if (hour >= 6 && hour < 12) timeSlot = 0;       // Morning
      else if (hour >= 12 && hour < 16) timeSlot = 1;  // Afternoon
      else if (hour >= 16 && hour < 20) timeSlot = 2;  // Evening
      else timeSlot = 3;                                // Night

      heatmapMatrix[timeSlot][dayOfWeek]++;
    }

    // Normalize to 0-3 intensity levels
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

    // --- Recent Activity (merged and sorted) ---
    const recentActivity = [
      ...recentEvents.map((e) => ({
        type: e.eventType,
        description: eventTypeToLabel(e.eventType),
        icon: eventTypeToIcon(e.eventType),
        createdAt: e.createdAt,
      })),
      ...recentFeedbacks.map((f) => ({
        type: "feedback_submit",
        description: `Feedback submitted (${f.rating} star${f.rating !== 1 ? "s" : ""})`,
        icon: "MessageSquare",
        createdAt: f.createdAt,
      })),
      ...recentStamps.map((s) => ({
        type: s.type,
        description: stampTypeToLabel(s.type),
        icon: stampTypeToIcon(s.type),
        createdAt: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

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
        recentActivity,
      },
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

function eventTypeToLabel(eventType: string): string {
  const labels: Record<string, string> = {
    guest_page_view: "Guest scanned QR / visited page",
    menu_click: "Digital menu viewed",
    review_click: "Google Review page opened",
    wifi_open: "Wi-Fi credentials viewed",
    wifi_copy: "Wi-Fi password copied",
    loyalty_open: "Loyalty card opened",
    loyalty_stamp_earned: "Loyalty stamp earned",
    feedback_submit: "Feedback submitted",
    social_click: "Social link clicked",
    game_open: "Game opened",
    review_prompt_view: "Review prompt viewed",
  };
  return labels[eventType] || eventType.replace(/_/g, " ");
}

function eventTypeToIcon(eventType: string): string {
  const icons: Record<string, string> = {
    guest_page_view: "QrCode",
    menu_click: "UtensilsCrossed",
    review_click: "Star",
    wifi_open: "Wifi",
    wifi_copy: "Wifi",
    loyalty_open: "Award",
    loyalty_stamp_earned: "Award",
    feedback_submit: "MessageSquare",
    social_click: "Share2",
    game_open: "Sparkles",
    review_prompt_view: "Star",
  };
  return icons[eventType] || "Activity";
}

function stampTypeToLabel(type: string): string {
  const labels: Record<string, string> = {
    STAMP_EARNED: "Loyalty stamp earned",
    STAMP_REVERSED: "Stamp reversed",
    MILESTONE_UNLOCKED: "Milestone unlocked!",
    REWARD_REDEEMED: "Reward redeemed",
    REWARD_EXPIRED: "Reward expired",
  };
  return labels[type] || type;
}

function stampTypeToIcon(type: string): string {
  const icons: Record<string, string> = {
    STAMP_EARNED: "Award",
    STAMP_REVERSED: "AlertCircle",
    MILESTONE_UNLOCKED: "Gift",
    REWARD_REDEEMED: "Gift",
    REWARD_EXPIRED: "Clock",
  };
  return icons[type] || "Award";
}
