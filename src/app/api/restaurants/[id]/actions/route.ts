import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { guestActionSchema } from "@/lib/validation/schemas";

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

    const actions = await prisma.guestAction.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: actions });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
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
    const parsed = guestActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid action data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const highestOrder = await prisma.guestAction.findFirst({
      where: { restaurantId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const nextOrder = (highestOrder?.displayOrder ?? -1) + 1;

    const action = await prisma.guestAction.create({
      data: {
        restaurantId,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description || null,
        icon: parsed.data.icon,
        url: parsed.data.url || null,
        enabled: parsed.data.enabled,
        displayOrder: parsed.data.displayOrder || nextOrder,
        badge: parsed.data.badge || null,
      },
    });

    return NextResponse.json({ success: true, data: action }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create action" }, { status: 500 });
  }
}
