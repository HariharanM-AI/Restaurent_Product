import { NextResponse } from "next/server";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { uploadClientAsset } from "@/lib/supabase/storage";
import { detectFileType } from "@/lib/uploads/file-signature";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized. Please sign in to upload files." } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: "No file was provided in the request." } },
        { status: 400 }
      );
    }

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { message: "File size exceeds 25MB limit." } },
        { status: 400 }
      );
    }

    // Resolve shop / restaurant ID to ensure client-specific and shop-specific storage
    let restaurantId =
      (formData.get("restaurantId") as string) ||
      (formData.get("shopId") as string);

    if (!restaurantId) {
      // Look up client's active restaurant membership
      const membership = await prisma.restaurantMember.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
      restaurantId = membership?.restaurantId || "";
    }

    // The storage path is scoped by restaurant, so the caller must belong to it
    const access = restaurantId
      ? await verifyRestaurantAccess(restaurantId, ["PLATFORM_ADMIN", "OWNER", "MANAGER"])
      : { authorized: false };
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: { message: "You do not have access to upload files for this restaurant." } },
        { status: 403 }
      );
    }

    // Resolve category (logos, covers, menus, or general)
    const CATEGORIES = ["logos", "covers", "menus", "general"] as const;
    const requestedCategory = formData.get("category");
    let category: (typeof CATEGORIES)[number] = CATEGORIES.includes(requestedCategory as never)
      ? (requestedCategory as (typeof CATEGORIES)[number])
      : "general";
    const requestedType = formData.get("type") as string;
    if (requestedType === "logo") category = "logos";
    if (requestedType === "cover") category = "covers";
    if (requestedType === "menu" || requestedType === "pdf" || requestedType === "image") category = "menus";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Trust the file's own bytes, not the browser-declared type
    const detectedType = detectFileType(buffer);
    if (!detectedType) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Only PDF documents and image files (JPEG, PNG, WebP, AVIF, GIF) are allowed." },
        },
        { status: 400 }
      );
    }

    // Upload directly to Supabase Storage structured strictly by client and shop
    const uploadResult = await uploadClientAsset({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: detectedType,
      clientId: session.user.id,
      shopId: restaurantId,
      category,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.publicUrl,
        storagePath: uploadResult.storagePath,
        filename: uploadResult.filename,
        size: file.size,
        type: detectedType,
        provider: "supabase",
      },
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: { message: "File upload failed. Please try again." } },
      { status: 500 }
    );
  }
}
