import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getGuestRestaurant } from "@/lib/db/guest-restaurant";
import { CustomerThemeSync } from "@/components/guest/customer-theme-sync";

export async function generateViewport({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}): Promise<Viewport> {
  const { restaurantSlug } = await params;
  const restaurant = await getGuestRestaurant(restaurantSlug);

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
    themeColor: restaurant?.primaryColor || "#0F766E",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const restaurant = await getGuestRestaurant(restaurantSlug);

  if (!restaurant) {
    return { title: "Restaurant Not Found" };
  }

  return {
    title: `${restaurant.name} — Guest Hub`,
    description: restaurant.tagline || `Welcome to ${restaurant.name}. Explore our menu, Wi-Fi, rewards, and feedback.`,
    openGraph: {
      title: `${restaurant.name} — Guest Hub`,
      description: restaurant.tagline || `Welcome to ${restaurant.name}.`,
      images: restaurant.coverImageUrl ? [restaurant.coverImageUrl] : undefined,
    },
  };
}

export default async function RestaurantGuestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const restaurant = await getGuestRestaurant(restaurantSlug);

  if (!restaurant) {
    notFound();
  }

  const primary = restaurant.primaryColor || "#0F766E";
  const secondary = restaurant.secondaryColor || "#F8FAFC";
  const themeMode = (restaurant.themeMode as "light" | "dark") || "light";

  return (
    <>
      {/* Inline SSR style ensures dynamic primary and secondary brand variables */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${primary} !important;
              --brand-primary: ${primary} !important;
              --brand-secondary: ${secondary} !important;
            }
          `,
        }}
      />
      <CustomerThemeSync
        restaurantId={restaurant.id}
        slug={restaurant.slug}
        initialThemeMode={themeMode}
        initialPrimaryColor={primary}
        initialSecondaryColor={secondary}
      >
        {children}
      </CustomerThemeSync>
    </>
  );
}
