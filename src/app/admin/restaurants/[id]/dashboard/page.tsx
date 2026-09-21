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

  return (
    <div className="w-full animate-in fade-in duration-200">
      <ExecutiveDashboard
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          primaryColor: restaurant.primaryColor,
        }}
      />
    </div>
  );
}
