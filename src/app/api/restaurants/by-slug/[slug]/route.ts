import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        actions: {
          where: { enabled: true },
          orderBy: { displayOrder: "asc" },
        },
        wifiConfig: true,
        socialLinks: {
          where: { enabled: true },
          orderBy: { displayOrder: "asc" },
        },
        loyaltyProgram: {
          include: {
            milestones: {
              where: { enabled: true },
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    });

    if (!restaurant || restaurant.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Restaurant not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            logoUrl: restaurant.logoUrl,
            coverImageUrl: restaurant.coverImageUrl,
            tagline: restaurant.tagline,
            primaryColor: restaurant.primaryColor,
            secondaryColor: restaurant.secondaryColor,
            address: restaurant.address,
            phone: restaurant.phone,
            website: restaurant.website,
            status: restaurant.status,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
          },
          actions: restaurant.actions,
          wifi: restaurant.wifiConfig?.enabled
            ? {
                ssid: restaurant.wifiConfig.ssid,
                password: restaurant.wifiConfig.password,
                enabled: restaurant.wifiConfig.enabled,
                instructions: restaurant.wifiConfig.instructions,
              }
            : null,
          socialLinks: restaurant.socialLinks,
          loyaltyProgram: restaurant.loyaltyProgram?.enabled
            ? {
                name: restaurant.loyaltyProgram.name,
                enabled: restaurant.loyaltyProgram.enabled,
                milestones: restaurant.loyaltyProgram.milestones,
              }
            : null,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch restaurant." } },
      { status: 500 }
    );
  }
}
