import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { WifiAdminForm } from "@/components/admin/wifi-admin-form";

export default async function WifiAdminPage({
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
    select: { id: true, name: true, slug: true },
  }));

  if (!restaurant) notFound();

  const wifiConfig = await prisma.wifiConfig.findUnique({
    where: { restaurantId },
  });

  return (
    <div className="w-full animate-in fade-in duration-200">
      <WifiAdminForm
        restaurant={restaurant}
        initialConfig={wifiConfig}
      />
    </div>
  );
}
