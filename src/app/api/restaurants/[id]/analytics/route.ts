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

    // Fetch aggregated events for this restaurant
    const events = await prisma.analyticsEvent.findMany({
      where: { restaurantId },
      select: {
        eventType: true,
        anonymousSessionId: true,
        source: true,
        createdAt: true,
      },
    });

    const totalViews = events.filter((e) => e.eventType === "guest_page_view").length;
    const uniqueSessions = new Set(events.map((e) => e.anonymousSessionId)).size;
    const menuClicks = events.filter((e) => e.eventType === "menu_click").length;
    const reviewClicks = events.filter((e) => e.eventType === "review_click").length;
    const wifiOpens = events.filter((e) => e.eventType === "wifi_open").length;
    const wifiCopies = events.filter((e) => e.eventType === "wifi_copy").length;
    const feedbackSubmits = events.filter((e) => e.eventType === "feedback_submit").length;
    const loyaltyOpens = events.filter((e) => e.eventType === "loyalty_open").length;
    const stampsEarned = events.filter((e) => e.eventType === "loyalty_stamp_earned").length;
    const gameOpens = events.filter((e) => e.eventType === "game_open").length;
    const socialClicks = events.filter((e) => e.eventType === "social_click").length;

    // Traffic sources breakdown
    const sourceBreakdown = {
      qr: events.filter((e) => e.source === "qr").length,
      nfc: events.filter((e) => e.source === "nfc").length,
      direct: events.filter((e) => e.source === "direct" || !e.source).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        totalViews,
        uniqueSessions,
        menuClicks,
        reviewClicks,
        wifiOpens,
        wifiCopies,
        feedbackSubmits,
        loyaltyOpens,
        stampsEarned,
        gameOpens,
        socialClicks,
        totalInteractions: events.length,
        sourceBreakdown,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
