import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageTransition } from "@/components/admin/page-transition";
import { AdminHeader } from "@/components/admin/admin-header";
import { Building2 } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  // Fetch full user details including contact info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  // Fetch all restaurants the user belongs to
  const memberships = await prisma.restaurantMember.findMany({
    where: { userId: session.user.id },
    include: {
      restaurant: true,
    },
    orderBy: [
      { restaurant: { createdAt: "asc" } },
      { createdAt: "asc" },
    ],
  });

  if (!memberships.length || !memberships[0]?.restaurant) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[28px] border border-slate-200 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">No Restaurant Associated</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Your user account is not currently linked to any active restaurants. Create your restaurant to begin managing your guest hub.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/signup"
              className="w-full py-3.5 px-4 rounded-xl bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition shadow-sm"
            >
              Create Restaurant Venue
            </Link>
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryRestaurant = memberships[0].restaurant;
  const restaurants = memberships.map((m) => ({
    id: m.restaurant.id,
    name: m.restaurant.name,
    slug: m.restaurant.slug,
    primaryColor: m.restaurant.primaryColor,
    logoUrl: m.restaurant.logoUrl,
    tagline: m.restaurant.tagline,
    address: m.restaurant.address,
    phone: m.restaurant.phone,
    status: m.restaurant.status,
    role: m.role,
  }));

  return (
    <AdminShell>
      <AdminNav
        restaurant={{
          id: primaryRestaurant.id,
          name: primaryRestaurant.name,
          slug: primaryRestaurant.slug,
          primaryColor: primaryRestaurant.primaryColor,
          logoUrl: primaryRestaurant.logoUrl,
          tagline: primaryRestaurant.tagline,
          address: primaryRestaurant.address,
        }}
        restaurants={restaurants}
        user={{
          id: user?.id,
          name: user?.name || session.user.name,
          email: user?.email || session.user.email,
          phone: user?.phone,
          address: user?.address,
        }}
      />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FAFC] overflow-x-hidden">
        {/* Top Desktop Bar */}
        <AdminHeader
          restaurantName={primaryRestaurant.name}
          restaurantSlug={primaryRestaurant.slug}
          restaurants={restaurants}
        />

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 overflow-x-hidden">
          <div className="w-full mx-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </AdminShell>
  );
}
