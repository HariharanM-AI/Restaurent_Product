import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MenuManager } from "@/components/admin/menu-manager";

export default async function AdminMenuPage({
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
    select: { id: true, name: true, slug: true, tagline: true },
  }));

  if (!restaurant) notFound();

  const menuAction = await prisma.guestAction.findFirst({
    where: { restaurantId, type: "MENU" },
  });

  let parsedMetadata = {
    menuType: "pdf" as "pdf" | "images" | "link" | "items",
    pdfUrl: "",
    images: [] as string[],
    externalUrl: "",
  };

  if (menuAction?.metadata) {
    try {
      parsedMetadata = { ...parsedMetadata, ...JSON.parse(menuAction.metadata) };
    } catch {
      // use defaults
    }
  }

  return (
    <div className="w-full animate-in fade-in duration-200">
      <MenuManager
        restaurantId={restaurantId}
        restaurantName={restaurant.name}
        restaurantSlug={restaurant.slug}
        restaurantTagline={restaurant.tagline || "Good Food • Great Company"}
        initialData={{
          ...parsedMetadata,
          title: menuAction?.title || "View Menu",
          description:
            menuAction?.description || "Explore seasonal farm-to-table lunch, dinner, and cocktails",
        }}
      />
    </div>
  );
}
