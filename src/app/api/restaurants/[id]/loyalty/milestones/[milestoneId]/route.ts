import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { loyaltyMilestoneSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: restaurantId, milestoneId } = await params;
    const access = await verifyRestaurantAccess(restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER"]);

    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    const body = await req.json();
    const parsed = loyaltyMilestoneSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await prisma.loyaltyMilestone.update({
      where: { id: milestoneId },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update milestone" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: restaurantId, milestoneId } = await params;
    const access = await verifyRestaurantAccess(restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER"]);

    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    await prisma.loyaltyMilestone.delete({
      where: { id: milestoneId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete milestone" }, { status: 500 });
  }
}
