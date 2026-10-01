import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess, invalidateRestaurantAccessCache } from "@/lib/auth/session";
import { restaurantUpdateSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const access = await verifyRestaurantAccess(restaurantId);

    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        socialLinks: {
          orderBy: { displayOrder: "asc" },
        },
        actions: {
          where: { enabled: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: restaurant });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const access = await verifyRestaurantAccess(restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER"]);

    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    const body = await req.json();
    const parsed = restaurantUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { instagramUrl, facebookUrl, ...restaurantData } = parsed.data;

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: restaurantData,
    });

    // Handle Instagram social link
    if (instagramUrl !== undefined) {
      if (instagramUrl && instagramUrl.trim()) {
        const existingInsta = await prisma.socialLink.findFirst({
          where: { restaurantId, platform: "INSTAGRAM" },
        });
        if (existingInsta) {
          await prisma.socialLink.update({
            where: { id: existingInsta.id },
            data: { url: instagramUrl.trim(), enabled: true },
          });
        } else {
          await prisma.socialLink.create({
            data: {
              restaurantId,
              platform: "INSTAGRAM",
              url: instagramUrl.trim(),
              enabled: true,
              displayOrder: 1,
            },
          });
        }
      } else {
        await prisma.socialLink.deleteMany({
          where: { restaurantId, platform: "INSTAGRAM" },
        });
      }
    }

    // Handle Facebook social link
    if (facebookUrl !== undefined) {
      if (facebookUrl && facebookUrl.trim()) {
        const existingFb = await prisma.socialLink.findFirst({
          where: { restaurantId, platform: "FACEBOOK" },
        });
        if (existingFb) {
          await prisma.socialLink.update({
            where: { id: existingFb.id },
            data: { url: facebookUrl.trim(), enabled: true },
          });
        } else {
          await prisma.socialLink.create({
            data: {
              restaurantId,
              platform: "FACEBOOK",
              url: facebookUrl.trim(),
              enabled: true,
              displayOrder: 2,
            },
          });
        }
      } else {
        await prisma.socialLink.deleteMany({
          where: { restaurantId, platform: "FACEBOOK" },
        });
      }
    }

    // Invalidate session cache and revalidate pages
    invalidateRestaurantAccessCache(restaurantId);
    try {
      revalidatePath(`/r/${updated.slug}`);
      revalidatePath(`/r/${updated.slug}/menu`);
      revalidatePath(`/admin/restaurants/${restaurantId}/branding`);
      revalidatePath("/admin", "layout");
    } catch {
      // Revalidation is best effort in non-request contexts
    }

    const fullRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        socialLinks: {
          orderBy: { displayOrder: "asc" },
        },
        actions: {
          where: { enabled: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, data: fullRestaurant });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json({ success: false, error: "Failed to update restaurant" }, { status: 500 });
  }
}
