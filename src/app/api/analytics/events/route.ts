import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { analyticsEventSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limitCheck = await rateLimit(`analytics_${ip}`, { limit: 60, windowMs: 60000 });

    if (!limitCheck.success) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = analyticsEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const data = parsed.data;

    await prisma.analyticsEvent.create({
      data: {
        restaurantId: data.restaurantId,
        eventType: data.eventType,
        actionId: data.actionId || null,
        anonymousSessionId: data.anonymousSessionId,
        deviceCategory: data.deviceCategory || "mobile",
        referrer: data.referrer || null,
        source: data.source || "direct",
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
