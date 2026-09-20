import { NextRequest, NextResponse } from "next/server";
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

    const updated = await prisma.guestAction.update({
      where: { id: actionId },
      data: parsed.data,
    });

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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete action" }, { status: 500 });
  }
}
