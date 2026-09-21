import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

/**
 * GET /api/restaurants/[id]/feedback/stats?period=today|7d|30d|90d|1y|custom&from=ISO&to=ISO
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
      currentFeedbacks,
      prevFeedbacks,
      currentAvg,
      prevAvg,
      ratingDist,
      feedbacksInPeriod,
      allFeedbacks,
    ] = await Promise.all([
      prisma.feedback.count({ where: { restaurantId, createdAt: dateFilter } }),
      prisma.feedback.count({ where: { restaurantId, createdAt: prevDateFilter } }),
      prisma.feedback.aggregate({ where: { restaurantId, createdAt: dateFilter }, _avg: { rating: true } }),
      prisma.feedback.aggregate({ where: { restaurantId, createdAt: prevDateFilter }, _avg: { rating: true } }),
      prisma.feedback.groupBy({
        by: ["rating"],
        where: { restaurantId, createdAt: dateFilter },
        _count: { rating: true },
      }),
      // For time-series + topic analysis
      prisma.feedback.findMany({
        where: { restaurantId, createdAt: dateFilter },
        select: { id: true, rating: true, category: true, message: true, createdAt: true, contact: true, isAnonymous: true },
        orderBy: { createdAt: "desc" },
      }),
      // ALL feedbacks for the list (last 200)
      prisma.feedback.findMany({
        where: { restaurantId },
        select: { id: true, rating: true, category: true, message: true, createdAt: true, contact: true, isAnonymous: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    // Rating distribution
    const ratingMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of ratingDist) {
      ratingMap[r.rating] = r._count.rating;
    }
    const totalInPeriod = currentFeedbacks || 1;
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratingMap[stars],
      pct: Math.round((ratingMap[stars] / totalInPeriod) * 100),
    }));

    // Sentiment
    const positive = (ratingMap[5] || 0) + (ratingMap[4] || 0);
    const neutral = ratingMap[3] || 0;
    const negative = (ratingMap[2] || 0) + (ratingMap[1] || 0);
    const positivePct = Math.round((positive / totalInPeriod) * 100);
    const neutralPct = Math.round((neutral / totalInPeriod) * 100);
    const negativePct = Math.round((negative / totalInPeriod) * 100);

    // Previous period sentiment for comparison
    const prevPositivePct = prevFeedbacks > 0
      ? (() => {
          // We'll approximate from overall avg
          const prevRating = prevAvg._avg.rating || 0;
          return prevRating >= 4 ? 80 : prevRating >= 3 ? 60 : 40;
        })()
      : 0;

    // Time-series (daily counts + avg rating)
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil(periodMs / dayMs));
    const dayCountMap = new Map<string, number>();
    const dayRatingMap = new Map<string, number[]>();

    for (const f of feedbacksInPeriod) {
      const key = new Date(f.createdAt).toISOString().split("T")[0];
      dayCountMap.set(key, (dayCountMap.get(key) || 0) + 1);
      if (!dayRatingMap.has(key)) dayRatingMap.set(key, []);
      dayRatingMap.get(key)!.push(f.rating);
    }

    const timeSeries: { date: string; count: number; avgRating: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const key = d.toISOString().split("T")[0];
      const ratings = dayRatingMap.get(key) || [];
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      timeSeries.push({
        date: key,
        count: dayCountMap.get(key) || 0,
        avgRating: Math.round(avg * 10) / 10,
      });
    }

    // Topic analysis from categories
    const topicCounts = new Map<string, number>();
    for (const f of feedbacksInPeriod) {
      const cat = f.category?.trim();
      if (cat) {
        topicCounts.set(cat, (topicCounts.get(cat) || 0) + 1);
      }
    }
    // Also do simple keyword extraction from messages
    const keywords = ["food", "service", "ambience", "staff", "cleanliness", "price", "drinks", "music", "atmosphere", "menu", "dessert", "wait"];
    for (const f of feedbacksInPeriod) {
      const lower = f.message.toLowerCase();
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          const label = kw.charAt(0).toUpperCase() + kw.slice(1);
          if (!topicCounts.has(label)) {
            topicCounts.set(label, 0);
          }
          topicCounts.set(label, topicCounts.get(label)! + 1);
        }
      }
    }

    const topicsArray = Array.from(topicCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const maxTopicCount = topicsArray.length > 0 ? topicsArray[0].count : 1;
    const topics = topicsArray.map((t) => ({
      ...t,
      pct: Math.round((t.count / maxTopicCount) * 100),
    }));

    // Unique categories for filter dropdown
    const categories = Array.from(new Set(
      allFeedbacks.map((f) => f.category).filter(Boolean) as string[]
    )).sort();

    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    const avgRating = currentAvg._avg.rating ? Number(currentAvg._avg.rating.toFixed(1)) : 0;
    const prevAvgRating = prevAvg._avg.rating ? Number(prevAvg._avg.rating.toFixed(1)) : 0;
    const ratingChange = prevAvgRating > 0
      ? Number((avgRating - prevAvgRating).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        kpis: {
          total: { current: currentFeedbacks, change: calcChange(currentFeedbacks, prevFeedbacks) },
          avgRating: { current: avgRating, change: ratingChange },
          positivePct: { current: positivePct, change: calcChange(positivePct, prevPositivePct) },
        },
        sentiment: {
          positive: { count: positive, pct: positivePct },
          neutral: { count: neutral, pct: neutralPct },
          negative: { count: negative, pct: negativePct },
          total: currentFeedbacks,
        },
        distribution,
        timeSeries,
        topics,
        categories,
        feedbacks: allFeedbacks,
      },
    });
  } catch (err) {
    console.error("Feedback stats API error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch feedback data" }, { status: 500 });
  }
}
