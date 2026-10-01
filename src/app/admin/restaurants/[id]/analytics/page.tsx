import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { PageHeader } from "@/components/ui/page-header";

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

  return (
    <div className="w-full animate-in fade-in duration-200">
      <PageHeader
        title="Guest Engagement Analytics"
        description="Track how guests interact with your digital touchpoints — QR scans, feature usage, and conversion metrics."
        breadcrumbs={[
          { label: "Restaurants", href: "/admin" },
          { label: restaurant?.name || "Restaurant", href: `/admin/restaurants/${restaurantId}/dashboard` },
          { label: "Analytics" },
        ]}
      />

      <AnalyticsDashboard restaurantId={restaurantId} />
    </div>
  );
}
