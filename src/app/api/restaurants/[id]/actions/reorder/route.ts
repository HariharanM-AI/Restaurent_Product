import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { reorderActionsSchema } from "@/lib/validation/schemas";

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
    const parsed = reorderActionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reorder payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderedIds } = parsed.data;

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.guestAction.updateMany({
          where: {
            id,
            restaurantId, // strictly tenant-scoped
          },
          data: {
            displayOrder: index,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to reorder actions" }, { status: 500 });
  }
}
