import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { wifiConfigSchema } from "@/lib/validation/schemas";

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

    const config = await prisma.wifiConfig.findUnique({
      where: { restaurantId },
    });

    return NextResponse.json({ success: true, data: config });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(
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
    const parsed = wifiConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid Wi-Fi settings", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await prisma.wifiConfig.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        ssid: parsed.data.ssid,
        password: parsed.data.password || "",
        enabled: parsed.data.enabled,
        instructions: parsed.data.instructions || null,
      },
      update: {
        ssid: parsed.data.ssid,
        password: parsed.data.password || "",
        enabled: parsed.data.enabled,
        instructions: parsed.data.instructions || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update Wi-Fi configuration" }, { status: 500 });
  }
}
