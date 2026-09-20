import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { loyaltyMilestoneSchema } from "@/lib/validation/schemas";

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
    const parsed = loyaltyMilestoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid milestone data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    let program = await prisma.loyaltyProgram.findUnique({
      where: { restaurantId },
    });

    if (!program) {
      program = await prisma.loyaltyProgram.create({
        data: {
          restaurantId,
          name: "Stamp Rewards",
          enabled: true,
        },
      });
    }

    const milestone = await prisma.loyaltyMilestone.create({
      data: {
        loyaltyProgramId: program.id,
        stampRequirement: parsed.data.stampRequirement,
        rewardTitle: parsed.data.rewardTitle,
        rewardDescription: parsed.data.rewardDescription || null,
        validityDays: parsed.data.validityDays,
        enabled: parsed.data.enabled,
        displayOrder: parsed.data.displayOrder,
      },
    });

    return NextResponse.json({ success: true, data: milestone }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create milestone" }, { status: 500 });
  }
}
