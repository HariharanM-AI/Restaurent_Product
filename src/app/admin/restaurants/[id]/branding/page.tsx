import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { RestaurantProfileTabs } from "@/components/admin/restaurant-profile-tabs";
import { PageHeader } from "@/components/ui/page-header";

export default async function BrandingPage({
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
    include: {
      actions: {
        where: { enabled: true },
        orderBy: { displayOrder: "asc" },
      },
      socialLinks: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!restaurant) {
    notFound();
  }

  return (
    <div className="w-full animate-in fade-in duration-200">
      <PageHeader
        title="Restaurant Profile"
        description="Manage your restaurant identity, branding, contact details, and account security."
        breadcrumbs={[
          { label: "Restaurants", href: "/admin" },
          { label: restaurant.name, href: `/admin/restaurants/${restaurant.id}/dashboard` },
          { label: "Restaurant Profile" },
        ]}
      />

      <RestaurantProfileTabs
        restaurant={restaurant}
        actions={restaurant.actions}
        initialSocialLinks={restaurant.socialLinks}
      />
    </div>
  );
}
