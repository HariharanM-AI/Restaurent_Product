import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AnalyticsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id: restaurantId } = await params;
  const access = await verifyRestaurantAccess(restaurantId);

  if (!access.authorized) notFound();

  const restaurant = access.restaurant || (await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true },
  }));

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

  const sourceBreakdown = {
    qr: events.filter((e) => e.source === "qr").length,
    nfc: events.filter((e) => e.source === "nfc").length,
    direct: events.filter((e) => e.source === "direct" || !e.source).length,
  };

  return (
    <div className="w-full animate-in fade-in duration-200">
      <PageHeader
        title="Guest Engagement Analytics"
        description="Physical QR touchpoint performance, guest journey conversion funnel, and feature interaction metrics."
        breadcrumbs={[
          { label: "Restaurants", href: "/admin" },
          { label: restaurant?.name || "Restaurant", href: `/admin/restaurants/${restaurantId}/dashboard` },
          { label: "Analytics" },
        ]}
        badge={<StatusBadge status="active" label="Telemetry Live" />}
      />

      <AnalyticsDashboard
        data={{
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
        }}
      />
    </div>
  );
}
