import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ExecutiveDashboard } from "@/components/admin/executive-dashboard";

export default async function DashboardPage({
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
  }));

  if (!restaurant) notFound();

  // Run ALL metric aggregations in a single parallel promise to minimize cloud database latency
  const [
    totalVisits,
    totalWallets,
    totalStamps,
    allFeedbacksCount,
    avgRatingResult,
    feedbacks,
    recentWallets,
    reviewAction,
    menuAction,
    wifiConfig,
    milestones,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { restaurantId, eventType: "guest_page_view" },
    }),
    prisma.loyaltyWallet.count({
      where: { restaurantId },
    }),
    prisma.loyaltyStampTransaction.count({
      where: { restaurantId, type: "STAMP_EARNED" },
    }),
    prisma.feedback.count({
      where: { restaurantId },
    }),
    prisma.feedback.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
    }),
    prisma.feedback.findMany({
      where: { restaurantId },
      select: {
        id: true,
        rating: true,
        message: true,
        contact: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.loyaltyWallet.findMany({
      where: { restaurantId },
      select: {
        id: true,
        anonymousBrowserId: true,
        createdAt: true,
        customer: {
          select: {
            displayName: true,
            email: true,
          },
        },
        transactions: {
          select: {
            type: true,
          },
        },
        rewards: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.guestAction.findFirst({
      where: { restaurantId, type: "REVIEW" },
      select: { url: true },
    }),
    prisma.guestAction.findFirst({
      where: { restaurantId, type: "MENU" },
      select: { metadata: true },
    }),
    prisma.wifiConfig.findUnique({
      where: { restaurantId },
      select: { ssid: true, enabled: true },
    }),
    prisma.loyaltyMilestone.findMany({
      where: {
        loyaltyProgram: {
          restaurantId,
        },
      },
      orderBy: { stampRequirement: "asc" },
    }),
  ]);

  const avgRating = avgRatingResult._avg.rating
    ? Number(avgRatingResult._avg.rating.toFixed(1))
    : 5.0;

  let menuType = "items";
  let pdfUrl = "";
  if (menuAction?.metadata) {
    try {
      const meta = JSON.parse(menuAction.metadata);
      menuType = meta.menuType || "items";
      pdfUrl = meta.pdfUrl || "";
    } catch {
      // fallback
    }
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-200">
      <ExecutiveDashboard
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          primaryColor: restaurant.primaryColor,
        }}
        metrics={{
          totalVisits,
          totalCustomers: totalWallets,
          totalStamps,
          totalFeedbacks: allFeedbacksCount,
          averageRating: avgRating,
        }}
        setupStatus={{
          googleReviewUrl: reviewAction?.url || "",
          menuType,
          pdfUrl,
          wifiSsid: wifiConfig?.ssid || "",
          wifiEnabled: wifiConfig?.enabled || false,
          milestonesCount: milestones.length,
        }}
        recentFeedbacks={feedbacks.map((f) => ({
          id: f.id,
          rating: f.rating,
          message: f.message,
          contact: f.contact,
          sentiment: f.rating >= 4 ? "POSITIVE" : f.rating === 3 ? "NEUTRAL" : "NEGATIVE",
          createdAt: f.createdAt,
        }))}
        milestones={milestones as any}
        recentCustomers={recentWallets.map((w) => ({
          id: w.id,
          name: w.customer?.displayName || `Guest ${w.anonymousBrowserId.slice(0, 6)}`,
          email: w.customer?.email,
          stamps: w.transactions.filter((t) => t.type === "STAMP_EARNED").length,
          rewards: w.rewards.filter((r) => r.status === "AVAILABLE").length,
          joinedAt: w.createdAt,
        }))}
      />
    </div>
  );
}
