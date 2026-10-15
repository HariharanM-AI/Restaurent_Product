import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { feedbackSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { sanitizeString } from "@/lib/utils";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { uploadFeedbackPhoto, deleteFeedbackPhotos, toFeedbackPhotoUrls } from "@/lib/supabase/feedback-photos";
import { FEEDBACK_IMAGE_LIMITS, FeedbackImageError, processFeedbackImage } from "@/lib/uploads/feedback-images";

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

    const data = feedbacks.map(({ imagePaths, ...rest }) => ({
      ...rest,
      photos: toFeedbackPhotoUrls(restaurantId, rest.id, imagePaths),
    }));

    return NextResponse.json({ success: true, data });
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
    const ip = getClientIp(req.headers);

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

    // Reject oversized bodies before buffering them (photos + small JSON payload)
    const MAX_BODY = FEEDBACK_IMAGE_LIMITS.maxImages * FEEDBACK_IMAGE_LIMITS.maxBytes + 64 * 1024;
    const declaredLength = Number(req.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY) {
      return NextResponse.json(
        { success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Photos are too large. Please attach smaller images." } },
        { status: 413 }
      );
    }

    // Accept multipart (feedback JSON in `payload` + up to 3 `images`) or plain JSON
    let body: any;
    let imageFiles: File[] = [];
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      try {
        body = JSON.parse(String(form.get("payload") ?? "{}"));
      } catch {
        body = {};
      }
      imageFiles = form.getAll("images").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);
    } else {
      body = await req.json();
    }

    if (imageFiles.length > FEEDBACK_IMAGE_LIMITS.maxImages) {
      return NextResponse.json(
        { success: false, error: { code: "TOO_MANY_IMAGES", message: `You can attach up to ${FEEDBACK_IMAGE_LIMITS.maxImages} photos.` } },
        { status: 400 }
      );
    }

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

    // 5. Validate + re-encode every photo before anything is uploaded
    let processed: Buffer[] = [];
    try {
      processed = await Promise.all(imageFiles.map((f) => processFeedbackImage(f)));
    } catch (err) {
      const message = err instanceof FeedbackImageError ? err.message : "One of the photos could not be processed.";
      return NextResponse.json({ success: false, error: { code: "INVALID_IMAGE", message } }, { status: 400 });
    }

    // Stored as tenant-prefixed storage paths; no public URL is ever handed out
    const uploadedPaths: string[] = [];
    try {
      for (const buf of processed) {
        uploadedPaths.push(await uploadFeedbackPhoto(restaurantId, buf));
      }
    } catch {
      await deleteFeedbackPhotos(uploadedPaths);
      return NextResponse.json(
        { success: false, error: { code: "UPLOAD_FAILED", message: "We couldn't upload your photos. Please try again." } },
        { status: 502 }
      );
    }

    // 6. Insert feedback record with sanitized message
    let feedback;
    try {
      feedback = await prisma.feedback.create({
        data: {
          restaurantId,
          rating: data.rating,
          category: data.category || "Other",
          message: sanitizeString(data.message),
          contact: data.contact ? sanitizeString(data.contact) : null,
          isAnonymous: data.isAnonymous,
          imagePaths: uploadedPaths,
        },
      });
    } catch (err) {
      // Don't leave orphaned photos behind if the record couldn't be saved
      await deleteFeedbackPhotos(uploadedPaths);
      throw err;
    }

    // 7. Record analytics event
    await prisma.analyticsEvent.create({
      data: {
        restaurantId,
        eventType: "feedback_submit",
        anonymousSessionId: "fb_" + feedback.id,
        metadata: JSON.stringify({ rating: data.rating, category: data.category, photos: uploadedPaths.length }),
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
