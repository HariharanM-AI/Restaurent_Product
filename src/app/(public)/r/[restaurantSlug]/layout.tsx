import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export async function generateViewport({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}): Promise<Viewport> {
  const { restaurantSlug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { primaryColor: true },
  });

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
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
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { name: true, tagline: true, coverImageUrl: true },
  });

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

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: {
      id: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  const primary = restaurant.primaryColor || "#0F766E";
  const secondary = restaurant.secondaryColor || "#F8FAFC";

  return (
    <>
      {/* Inline SSR style ensures zero flash of green during initial paint */}
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
      <div
        className="min-h-screen bg-slate-100 flex flex-col justify-start"
        style={
          {
            "--primary": primary,
            "--brand-primary": primary,
            "--brand-secondary": secondary,
          } as React.CSSProperties
        }
      >
        <div className="w-full max-w-md mx-auto min-h-screen bg-white shadow-2xl border-x border-slate-200/60 flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}
