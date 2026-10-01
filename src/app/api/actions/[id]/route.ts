import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { guestActionSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: actionId } = await params;

    const action = await prisma.guestAction.findUnique({
      where: { id: actionId },
      include: { restaurant: { select: { slug: true } } },
    });

    if (!action) {
      return NextResponse.json({ success: false, error: "Action not found" }, { status: 404 });
    }

    const access = await verifyRestaurantAccess(action.restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER"]);
    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    const body = await req.json();
    const parsed = guestActionSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updateData = { ...parsed.data };
    if ("badge" in body) {
      const rawBadge = body.badge;
      updateData.badge = typeof rawBadge === "string" && rawBadge.trim().length > 0 ? rawBadge.trim() : null;
    }

    const updated = await prisma.guestAction.update({
      where: { id: actionId },
      data: updateData,
    });

    // Invalidate cached guest hub pages so updates show immediately
    if (action.restaurant?.slug) {
      revalidatePath(`/r/${action.restaurant.slug}`);
      revalidatePath(`/r/${action.restaurant.slug}/menu`);
      revalidatePath(`/r/${action.restaurant.slug}/rewards`);
      revalidatePath(`/r/${action.restaurant.slug}/wifi`);
      revalidatePath(`/r/${action.restaurant.slug}/feedback`);
      revalidatePath(`/r/${action.restaurant.slug}/game`);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update action" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: actionId } = await params;

    const action = await prisma.guestAction.findUnique({
      where: { id: actionId },
      include: { restaurant: { select: { slug: true } } },
    });

    if (!action) {
      return NextResponse.json({ success: false, error: "Action not found" }, { status: 404 });
    }

    const access = await verifyRestaurantAccess(action.restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER"]);
    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    await prisma.guestAction.delete({
      where: { id: actionId },
    });

    if (action.restaurant?.slug) {
      revalidatePath(`/r/${action.restaurant.slug}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete action" }, { status: 500 });
  }
}
