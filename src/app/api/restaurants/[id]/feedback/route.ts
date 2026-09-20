import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { feedbackSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/utils";
import { verifyRestaurantAccess } from "@/lib/auth/session";

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

    const feedbacks = await prisma.feedback.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: feedbacks });
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 1. Rate Limiting: Max 5 submissions per 10 minutes per IP
    const limitCheck = await rateLimit(`feedback_${restaurantId}_${ip}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!limitCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many submissions. Please wait a few minutes before submitting again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Anti-bot honeypot check
    if (body.website_hp && body.website_hp.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "SPAM_DETECTED", message: "Submission rejected." } },
        { status: 400 }
      );
    }

    // 3. Schema validation
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Please check your feedback inputs.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 4. Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Restaurant not found." } },
        { status: 404 }
      );
    }

    // 5. Insert feedback record with sanitized message
    const feedback = await prisma.feedback.create({
      data: {
        restaurantId,
        rating: data.rating,
        category: data.category || "Other",
        message: sanitizeString(data.message),
        contact: data.contact ? sanitizeString(data.contact) : null,
        isAnonymous: data.isAnonymous,
      },
    });

    // 6. Record analytics event
    await prisma.analyticsEvent.create({
      data: {
        restaurantId,
        eventType: "feedback_submit",
        anonymousSessionId: "fb_" + feedback.id,
        metadata: JSON.stringify({ rating: data.rating, category: data.category }),
      },
    });

    return NextResponse.json({ success: true, data: { id: feedback.id } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to submit feedback. Please try again later." },
      },
      { status: 500 }
    );
  }
}
