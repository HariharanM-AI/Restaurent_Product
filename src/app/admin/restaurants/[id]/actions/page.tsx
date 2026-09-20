import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ActionsManagerList } from "@/components/admin/actions-manager-list";

export default async function ActionsAdminPage({
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

  const restaurant = access.restaurant || (await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, slug: true },
  }));

  if (!restaurant) notFound();

  const actions = await prisma.guestAction.findMany({
    where: { restaurantId },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="w-full animate-in fade-in duration-200">
      <ActionsManagerList
        initialActions={actions}
        restaurantId={restaurantId}
        restaurantName={restaurant.name}
        restaurantSlug={restaurant.slug}
      />
    </div>
  );
}
