import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { RestaurantHeader } from "@/components/guest/restaurant-header";
import { GuestActionList } from "@/components/guest/action-list";
import { SocialFooter } from "@/components/guest/social-footer";
import { GuestHubTracker } from "@/components/guest/guest-hub-tracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RestaurantGuestPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: {
      actions: {
        where: { enabled: true },
        orderBy: { displayOrder: "asc" },
      },
      wifiConfig: true,
      socialLinks: {
        where: { enabled: true },
        orderBy: { displayOrder: "asc" },
      },
      loyaltyProgram: {
        include: {
          milestones: {
            where: { enabled: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  });

  if (!restaurant || restaurant.status !== "ACTIVE") {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-surface dark:bg-slate-900 transition-colors">
      {/* Client telemetry tracker for page view */}
      <GuestHubTracker restaurantId={restaurant.id} />

      <div>
        {/* Branded Cover & Restaurant Profile Header */}
        <RestaurantHeader
          restaurant={{
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            logoUrl: restaurant.logoUrl,
            coverImageUrl: restaurant.coverImageUrl,
            tagline: restaurant.tagline,
            primaryColor: restaurant.primaryColor,
            secondaryColor: restaurant.secondaryColor,
            address: restaurant.address,
            phone: restaurant.phone,
            website: restaurant.website,
            openingHours: restaurant.openingHours,
            googleMapsUrl: restaurant.googleMapsUrl,
            status: restaurant.status,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
          }}
        />

        {/* Action Prompt Header */}
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Quick Actions
          </h2>
        </div>

        {/* Staggered Action Cards Stack */}
        <GuestActionList
          actions={restaurant.actions.map((a) => ({
            id: a.id,
            restaurantId: a.restaurantId,
            type: a.type,
            title: a.title,
            description: a.description,
            icon: a.icon,
            url: a.url,
            enabled: a.enabled,
            displayOrder: a.displayOrder,
            badge: a.badge,
            metadata: a.metadata,
          }))}
          restaurantId={restaurant.id}
          brandPrimaryColor={restaurant.primaryColor}
        />
      </div>

      {/* Social Links Footer */}
      <SocialFooter
        socialLinks={restaurant.socialLinks.map((s) => ({
          id: s.id,
          restaurantId: s.restaurantId,
          platform: s.platform,
          url: s.url,
          enabled: s.enabled,
          displayOrder: s.displayOrder,
        }))}
        restaurantId={restaurant.id}
      />
    </div>
  );
}
