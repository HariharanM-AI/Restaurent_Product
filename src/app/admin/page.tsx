import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminRootPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await prisma.restaurantMember.findFirst({
    where: { userId: session.user.id },
    include: { restaurant: true },
    orderBy: [
      { restaurant: { createdAt: "asc" } },
      { createdAt: "asc" },
    ],
  });

  if (membership?.restaurant) {
    redirect(`/admin/restaurants/${membership.restaurant.id}/dashboard`);
  }

  redirect("/login");
}
