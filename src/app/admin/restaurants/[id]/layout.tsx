import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageTransition } from "@/components/admin/page-transition";
import { AdminHeader } from "@/components/admin/admin-header";
import { Building2, ShieldCheck, ArrowLeft } from "lucide-react";

export default async function RestaurantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/admin/restaurants/${id}/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
    },
  });

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  // Fetch the target restaurant
  const currentRestaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!currentRestaurant) {
    redirect(isPlatformAdmin ? "/admin/platform" : "/admin");
  }

  // Fetch all venues accessible by this user
  let accessibleRestaurants: any[] = [];

  if (isPlatformAdmin) {
    accessibleRestaurants = await prisma.restaurant.findMany({
      orderBy: { name: "asc" },
    });
  } else {
    const memberships = await prisma.restaurantMember.findMany({
      where: { userId: session.user.id },
      include: { restaurant: true },
      orderBy: [{ restaurant: { createdAt: "asc" } }, { createdAt: "asc" }],
    });

    const isMember = memberships.some((m) => m.restaurantId === id);
    if (!isMember) {
      redirect("/admin");
    }

    accessibleRestaurants = memberships.map((m) => m.restaurant);
  }

  const restaurantsList = accessibleRestaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    primaryColor: r.primaryColor,
    logoUrl: r.logoUrl,
    tagline: r.tagline,
    address: r.address,
    phone: r.phone,
    status: r.status,
    role: isPlatformAdmin ? "PLATFORM_ADMIN" : "OWNER",
  }));

  return (
    <AdminShell>
      <AdminNav
        restaurant={{
          id: currentRestaurant.id,
          name: currentRestaurant.name,
          slug: currentRestaurant.slug,
          primaryColor: currentRestaurant.primaryColor,
          logoUrl: currentRestaurant.logoUrl,
          tagline: currentRestaurant.tagline,
          address: currentRestaurant.address,
        }}
        restaurants={restaurantsList}
        user={{
          id: user?.id,
          name: user?.name || session.user.name,
          email: user?.email || session.user.email,
          phone: user?.phone,
          address: user?.address,
        }}
      />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FAFC] overflow-x-hidden">
        {/* Platform Admin Impersonation / Inspection Banner */}
        {isPlatformAdmin && (
          <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800 z-30">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">
                Platform Admin Mode: Viewing <strong className="text-white">{currentRestaurant.name}</strong>
              </span>
            </div>
            <Link
              href="/admin/platform"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Master Admin</span>
            </Link>
          </div>
        )}

        {/* Top Desktop Bar */}
        <AdminHeader
          restaurantName={currentRestaurant.name}
          restaurantSlug={currentRestaurant.slug}
          restaurants={restaurantsList}
        />

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 overflow-x-hidden">
          <div className="w-full mx-auto">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </AdminShell>
  );
}
