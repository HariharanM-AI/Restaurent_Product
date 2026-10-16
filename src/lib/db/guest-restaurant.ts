import { cache } from "react";
import { prisma } from "@/lib/db/prisma";

/**
 * Deduplicated, request-memoized fetcher for guest restaurant pages.
 * Shares a single database query across generateViewport, generateMetadata,
 * RestaurantGuestLayout, and RestaurantGuestPage within a single request.
 */
export const getGuestRestaurant = cache(async (slug: string) => {
  return prisma.restaurant.findUnique({
    where: { slug },
    include: {
      actions: {
        where: { enabled: true },
        orderBy: { displayOrder: "asc" },
      },
      socialLinks: {
        where: { enabled: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
});
