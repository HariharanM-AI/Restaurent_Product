import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BrandingEditorForm } from "@/components/admin/branding-editor-form";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

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
        description="Manage restaurant identity, logo, cover photography, brand color palette, operating schedule, and contact channels."
        breadcrumbs={[
          { label: "Restaurants", href: "/admin" },
          { label: restaurant.name, href: `/admin/restaurants/${restaurant.id}/dashboard` },
          { label: "Restaurant Profile" },
        ]}
      />

      <BrandingEditorForm
        restaurant={restaurant}
        actions={restaurant.actions}
        initialSocialLinks={restaurant.socialLinks}
      />
    </div>
  );
}
