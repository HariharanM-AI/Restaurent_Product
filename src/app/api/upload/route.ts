import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { uploadClientAsset } from "@/lib/supabase/storage";

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

    // Validate extension / MIME
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/svg+xml",
      "image/gif",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Only PDF documents and image files (JPEG, PNG, WebP, SVG, GIF) are allowed.",
          },
        },
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
      restaurantId = membership?.restaurantId || "default-shop";
    }

    // Resolve category (logos, covers, menus, or general)
    let category = (formData.get("category") as "logos" | "covers" | "menus" | "general") || "general";
    const requestedType = formData.get("type") as string;
    if (requestedType === "logo") category = "logos";
    if (requestedType === "cover") category = "covers";
    if (requestedType === "menu" || requestedType === "pdf" || requestedType === "image") category = "menus";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload directly to Supabase Storage structured strictly by client and shop
    const uploadResult = await uploadClientAsset({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
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
        type: file.type,
        provider: "supabase",
      },
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "File upload to Supabase failed. Please try again." } },
      { status: 500 }
    );
  }
}
