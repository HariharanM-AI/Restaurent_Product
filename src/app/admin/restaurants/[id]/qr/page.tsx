import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { QrExporter } from "@/components/admin/qr-exporter";

export default async function QrExporterPage({
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
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
      tagline: true,
    },
  }));

  if (!restaurant) notFound();

  return (
    <div className="w-full animate-in fade-in duration-200">
      <QrExporter
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        primaryColor={restaurant.primaryColor}
        tagline={restaurant.tagline || "Good Food • Better Company"}
      />
    </div>
  );
}
