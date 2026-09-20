import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyRestaurantAccess } from "@/lib/auth/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const access = await verifyRestaurantAccess(restaurantId);

    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: { message: access.error || "Unauthorized" } },
        { status: 403 }
      );
    }

    const reviewAction = await prisma.guestAction.findFirst({
      where: { restaurantId, type: "REVIEW" },
    });

    return NextResponse.json({
      success: true,
      data: {
        actionId: reviewAction?.id,
        googleReviewUrl: reviewAction?.url || "https://maps.google.com",
        title: reviewAction?.title || "Leave a Google Review",
        description: reviewAction?.description || "Share your culinary experience with the community",
      },
    });
  } catch (error: any) {
    console.error("Get google review error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch Google review link." } },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const access = await verifyRestaurantAccess(restaurantId, ["OWNER", "MANAGER", "PLATFORM_ADMIN"]);

    if (!access.authorized) {
      return NextResponse.json(
        { success: false, error: { message: access.error || "Unauthorized" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { googleReviewUrl, title, description } = body;

    if (!googleReviewUrl || !googleReviewUrl.trim()) {
      return NextResponse.json(
        { success: false, error: { message: "Google review URL is required." } },
        { status: 400 }
      );
    }

    const cleanUrl = googleReviewUrl.trim();

    const existing = await prisma.guestAction.findFirst({
      where: { restaurantId, type: "REVIEW" },
    });

    let updatedAction;
    if (existing) {
      updatedAction = await prisma.guestAction.update({
        where: { id: existing.id },
        data: {
          url: cleanUrl,
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          enabled: true,
        },
      });
    } else {
      updatedAction = await prisma.guestAction.create({
        data: {
          restaurantId,
          type: "REVIEW",
          title: title || "Leave a Google Review",
          description: description || "Share your culinary experience with the community",
          icon: "Star",
          url: cleanUrl,
          displayOrder: 2,
          badge: "5-Star",
          enabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        actionId: updatedAction.id,
        googleReviewUrl: updatedAction.url,
      },
    });
  } catch (error: any) {
    console.error("Update google review error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update Google review link." } },
      { status: 500 }
    );
  }
}
