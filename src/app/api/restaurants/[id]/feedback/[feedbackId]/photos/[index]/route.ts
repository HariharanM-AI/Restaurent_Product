import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";
import { downloadFeedbackPhoto, getFeedbackPhotoPublicUrl, isPathForRestaurant } from "@/lib/supabase/feedback-photos";

/**
 * GET /api/restaurants/[id]/feedback/[feedbackId]/photos/[index]
 * Streams one guest feedback photo to an admin of THAT restaurant only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string; index: string }> }
) {
  const { id: restaurantId, feedbackId, index } = await params;

  const access = await verifyRestaurantAccess(restaurantId);
  if (!access.authorized) {
    return NextResponse.json({ success: false, error: access.error }, { status: 403 });
  }

  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i > 9) {
    return NextResponse.json({ success: false, error: "Photo not found" }, { status: 404 });
  }

  // Tenant-scoped lookup: another restaurant's feedback simply doesn't exist here
  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, restaurantId },
    select: { imagePaths: true },
  });
  const path = feedback?.imagePaths[i];
  if (!path || !isPathForRestaurant(path, restaurantId)) {
    return NextResponse.json({ success: false, error: "Photo not found" }, { status: 404 });
  }

  const bytes = await downloadFeedbackPhoto(path);
  if (!bytes) {
    const pubUrl = getFeedbackPhotoPublicUrl(path);
    if (pubUrl) {
      return NextResponse.redirect(pubUrl);
    }
    return NextResponse.json({ success: false, error: "Photo unavailable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.length),
      // Per-user cache only; never stored by shared caches or CDNs
      "Cache-Control": "private, max-age=600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
