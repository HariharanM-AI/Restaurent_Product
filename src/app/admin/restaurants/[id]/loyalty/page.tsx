import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { LoyaltyAdminDashboard } from "@/components/admin/loyalty-admin-dashboard";

export default async function LoyaltyAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id: restaurantId } = await params;
  const access = await verifyRestaurantAccess(restaurantId);

  if (!access.authorized) {
    notFound();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      slug: true,
      primaryColor: true,
      loyaltyProgram: {
        include: {
          milestones: {
            orderBy: { stampRequirement: "asc" },
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  return (
    <div className="animate-in fade-in duration-200">
      <LoyaltyAdminDashboard
        restaurantId={restaurantId}
        restaurantSlug={restaurant.slug}
        primaryColor={restaurant.primaryColor}
        initialMilestones={restaurant.loyaltyProgram?.milestones || []}
      />
    </div>
  );
}
