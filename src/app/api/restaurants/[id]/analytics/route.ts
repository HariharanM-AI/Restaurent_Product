import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

/**
 * GET /api/restaurants/[id]/analytics?period=today|7d|30d|90d|1y|custom&from=ISO&to=ISO
 * Returns engagement analytics: per-feature funnel, touchpoint distribution, conversion rates, time-series
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

    // Fetch all events in current and previous period
    const [currentEvents, prevEvents] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { restaurantId, createdAt: dateFilter },
        select: { eventType: true, source: true, createdAt: true, anonymousSessionId: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { restaurantId, createdAt: prevDateFilter },
        select: { eventType: true, source: true, createdAt: true, anonymousSessionId: true },
      }),
    ]);

    // ── KPIs ──
    const totalVisits = currentEvents.filter((e) => e.eventType === "guest_page_view").length;
    const prevVisits = prevEvents.filter((e) => e.eventType === "guest_page_view").length;
    const uniqueSessions = new Set(currentEvents.map((e) => e.anonymousSessionId)).size;
    const prevUniqueSessions = new Set(prevEvents.map((e) => e.anonymousSessionId)).size;
    const totalInteractions = currentEvents.filter((e) => e.eventType !== "guest_page_view").length;
    const prevInteractions = prevEvents.filter((e) => e.eventType !== "guest_page_view").length;
    const conversionRate = totalVisits > 0 ? Math.round((totalInteractions / totalVisits) * 100) : 0;
    const prevConversionRate = prevVisits > 0 ? Math.round((prevInteractions / prevVisits) * 100) : 0;

    const calcChange = (c: number, p: number) => {
      if (p === 0) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100 * 10) / 10;
    };

    // ── Engagement Funnel (per-feature breakdown) ──
    const featureMap: Record<string, { label: string; icon: string; color: string }> = {
      menu_click: { label: "Digital Menu Views", icon: "UtensilsCrossed", color: "teal" },
      review_click: { label: "Google Review Clicks", icon: "Star", color: "amber" },
      wifi_open: { label: "Wi-Fi Page Opens", icon: "Wifi", color: "sky" },
      wifi_copy: { label: "Wi-Fi Password Copies", icon: "Wifi", color: "blue" },
      feedback_submit: { label: "Feedback Submissions", icon: "MessageSquare", color: "purple" },
      loyalty_open: { label: "Loyalty Wallet Opens", icon: "Award", color: "emerald" },
      loyalty_stamp_earned: { label: "Stamps Earned", icon: "Gift", color: "green" },
      game_open: { label: "Game Starts", icon: "Gamepad2", color: "indigo" },
      social_click: { label: "Social Media Clicks", icon: "Share2", color: "rose" },
    };

    const funnel = Object.entries(featureMap).map(([eventType, meta]) => {
      const current = currentEvents.filter((e) => e.eventType === eventType).length;
      const prev = prevEvents.filter((e) => e.eventType === eventType).length;
      return {
        eventType,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        count: current,
        prevCount: prev,
        change: calcChange(current, prev),
        pct: totalVisits > 0 ? Math.round((current / totalVisits) * 100) : 0,
      };
    }).sort((a, b) => b.count - a.count);

    // ── Touchpoint Distribution (QR / NFC / Direct) ──
    const qrCurrent = currentEvents.filter((e) => e.source === "qr").length;
    const nfcCurrent = currentEvents.filter((e) => e.source === "nfc").length;
    const directCurrent = currentEvents.filter((e) => e.source === "direct" || !e.source).length;
    const totalSource = qrCurrent + nfcCurrent + directCurrent || 1;

    const qrPrev = prevEvents.filter((e) => e.source === "qr").length;
    const nfcPrev = prevEvents.filter((e) => e.source === "nfc").length;
    const directPrev = prevEvents.filter((e) => e.source === "direct" || !e.source).length;

    const touchpoints = {
      qr: { count: qrCurrent, pct: Math.round((qrCurrent / totalSource) * 100), change: calcChange(qrCurrent, qrPrev) },
      nfc: { count: nfcCurrent, pct: Math.round((nfcCurrent / totalSource) * 100), change: calcChange(nfcCurrent, nfcPrev) },
      direct: { count: directCurrent, pct: Math.round((directCurrent / totalSource) * 100), change: calcChange(directCurrent, directPrev) },
    };

    // ── Time-series (daily breakdown) ──
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil(periodMs / dayMs));
    const dayVisitMap = new Map<string, number>();
    const dayInteractionMap = new Map<string, number>();

    for (const e of currentEvents) {
      const key = new Date(e.createdAt).toISOString().split("T")[0];
      if (e.eventType === "guest_page_view") {
        dayVisitMap.set(key, (dayVisitMap.get(key) || 0) + 1);
      } else {
        dayInteractionMap.set(key, (dayInteractionMap.get(key) || 0) + 1);
      }
    }

    const timeSeries: { date: string; visits: number; interactions: number }[] = [];
    const curDate = new Date(startDate);
    curDate.setUTCHours(0, 0, 0, 0);
    const finalDate = new Date(endDate);
    finalDate.setUTCHours(0, 0, 0, 0);

    while (curDate <= finalDate) {
      const key = curDate.toISOString().split("T")[0];
      timeSeries.push({
        date: key,
        visits: dayVisitMap.get(key) || 0,
        interactions: dayInteractionMap.get(key) || 0,
      });
      curDate.setUTCDate(curDate.getUTCDate() + 1);
    }

    // ── Top Performing Features (for highlight) ──
    const topFeature = funnel.length > 0 ? funnel[0] : null;
    const leastUsedFeature = funnel.length > 0 ? funnel[funnel.length - 1] : null;

    // ── Hourly Heatmap (for "peak hours") ──
    const hourCounts = new Array(24).fill(0);
    for (const e of currentEvents) {
      const h = new Date(e.createdAt).getHours();
      hourCounts[h]++;
    }
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return NextResponse.json({
      success: true,
      data: {
        period,
        kpis: {
          totalVisits: { current: totalVisits, change: calcChange(totalVisits, prevVisits) },
          uniqueGuests: { current: uniqueSessions, change: calcChange(uniqueSessions, prevUniqueSessions) },
          totalInteractions: { current: totalInteractions, change: calcChange(totalInteractions, prevInteractions) },
          conversionRate: { current: conversionRate, change: conversionRate - prevConversionRate },
        },
        funnel,
        touchpoints,
        timeSeries,
        insights: {
          topFeature: topFeature ? { label: topFeature.label, count: topFeature.count } : null,
          leastUsed: leastUsedFeature ? { label: leastUsedFeature.label, count: leastUsedFeature.count } : null,
          peakHour,
          peakHourLabel: `${peakHour}:00 - ${peakHour + 1}:00`,
        },
        hourlyDistribution: hourCounts,
      },
    });
  } catch (err) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
