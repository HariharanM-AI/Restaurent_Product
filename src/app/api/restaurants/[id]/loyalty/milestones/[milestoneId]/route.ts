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

    // Tenant-scoped write: the milestone must belong to the authorized restaurant
    const result = await prisma.loyaltyMilestone.updateMany({
      where: { id: milestoneId, loyaltyProgram: { restaurantId } },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: "Milestone not found" }, { status: 404 });
    }

    const updated = await prisma.loyaltyMilestone.findUnique({ where: { id: milestoneId } });

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

    // Tenant-scoped delete: the milestone must belong to the authorized restaurant
    const result = await prisma.loyaltyMilestone.deleteMany({
      where: { id: milestoneId, loyaltyProgram: { restaurantId } },
    });

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: "Milestone not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete milestone" }, { status: 500 });
  }
}
