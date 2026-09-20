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

    const menuAction = await prisma.guestAction.findFirst({
      where: {
        restaurantId,
        type: "MENU",
      },
    });

    if (!menuAction) {
      return NextResponse.json({
        success: true,
        data: {
          menuType: "items",
          pdfUrl: "",
          images: [],
          externalUrl: "",
        },
      });
    }

    let parsedMetadata = {
      menuType: "items",
      pdfUrl: "",
      images: [] as string[],
      externalUrl: "",
    };

    if (menuAction.metadata) {
      try {
        parsedMetadata = { ...parsedMetadata, ...JSON.parse(menuAction.metadata) };
      } catch {
        // use defaults
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        actionId: menuAction.id,
        title: menuAction.title,
        description: menuAction.description,
        url: menuAction.url,
        ...parsedMetadata,
      },
    });
  } catch (error: any) {
    console.error("Fetch menu error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to load menu configuration." } },
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
    const { menuType, pdfUrl, images, externalUrl, title, description } = body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: { message: "Restaurant not found." } },
        { status: 404 }
      );
    }

    const metadataObj = {
      menuType: menuType || "items",
      pdfUrl: pdfUrl || "",
      images: Array.isArray(images) ? images : [],
      externalUrl: externalUrl || "",
    };

    const targetUrl =
      menuType === "link" && externalUrl
        ? externalUrl
        : `/r/${restaurant.slug}/menu`;

    // Upsert the MENU action
    const existing = await prisma.guestAction.findFirst({
      where: { restaurantId, type: "MENU" },
    });

    let updatedAction;
    if (existing) {
      updatedAction = await prisma.guestAction.update({
        where: { id: existing.id },
        data: {
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          url: targetUrl,
          metadata: JSON.stringify(metadataObj),
        },
      });
    } else {
      updatedAction = await prisma.guestAction.create({
        data: {
          restaurantId,
          type: "MENU",
          title: title || "Digital Dining Menu",
          description: description || "Explore seasonal culinary selections",
          icon: "UtensilsCrossed",
          url: targetUrl,
          displayOrder: 1,
          badge: "Menu",
          metadata: JSON.stringify(metadataObj),
          enabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        actionId: updatedAction.id,
        ...metadataObj,
        url: updatedAction.url,
      },
    });
  } catch (error: any) {
    console.error("Update menu error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update menu configuration." } },
      { status: 500 }
    );
  }
}
