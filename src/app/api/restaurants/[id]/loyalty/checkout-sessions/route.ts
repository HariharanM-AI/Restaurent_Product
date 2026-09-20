import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { generateCheckoutToken } from "@/lib/loyalty/token";
import { loyaltyCheckoutSessionSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const access = await verifyRestaurantAccess(restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER", "STAFF"]);

    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: 403 });
    }

    let validityMinutes = 15;
    try {
      const body = await req.json();
      const parsed = loyaltyCheckoutSessionSchema.safeParse(body);
      if (parsed.success) {
        validityMinutes = parsed.data.validityMinutes;
      }
    } catch {
      // Use default 15 minutes
    }

    const { rawToken, tokenHash } = generateCheckoutToken();
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

    const session = await prisma.loyaltyCheckoutSession.create({
      data: {
        restaurantId,
        tokenHash,
        status: "ACTIVE",
        expiresAt,
      },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const claimUrl = `${protocol}://${host}/loyalty/claim/${rawToken}`;

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        rawToken,
        claimUrl,
        expiresAt: session.expiresAt,
        validityMinutes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate checkout session" },
      { status: 500 }
    );
  }
}
