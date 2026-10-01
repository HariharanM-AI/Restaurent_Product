import { NextRequest, NextResponse } from "next/server";
import { getSession, invalidateRestaurantAccessCache } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.restaurantMember.findMany({
      where: { userId: session.user.id },
      include: { restaurant: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: memberships.map((m) => ({
        ...m.restaurant,
        role: m.role,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch restaurants" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, tagline, address, phone } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Venue name must be at least 2 characters" }, { status: 400 });
    }

    const trimmedName = name.trim();
    let baseSlug = slugify(trimmedName);
    if (!baseSlug) baseSlug = "venue";

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create in transaction
    const newRestaurant = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: trimmedName,
          slug,
          tagline: tagline?.trim() || null,
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          primaryColor: "#0F766E",
          secondaryColor: "#F8FAFC",
          status: "ACTIVE",
        },
      });

      await tx.restaurantMember.create({
        data: {
          userId: session.user.id,
          restaurantId: restaurant.id,
          role: "OWNER",
        },
      });

      // Default actions
      await tx.guestAction.createMany({
        data: [
          {
            restaurantId: restaurant.id,
            type: "MENU",
            title: "Digital Dining Menu",
            description: "Explore culinary offerings and seasonal pairings",
            icon: "UtensilsCrossed",
            url: `/r/${slug}/menu`,
            displayOrder: 1,
            badge: "Fresh Menu",
            enabled: true,
          },
          {
            restaurantId: restaurant.id,
            type: "REVIEW",
            title: "Leave a Google Review",
            description: "Share your experience with the community on Google Maps",
            icon: "Star",
            url: "https://maps.google.com",
            displayOrder: 2,
            badge: "5-Star",
            enabled: true,
          },
          {
            restaurantId: restaurant.id,
            type: "WIFI",
            title: "Connect to Wi-Fi",
            description: "Fast, complimentary wireless internet for guests",
            icon: "Wifi",
            url: `/r/${slug}/wifi`,
            displayOrder: 3,
            badge: "Free",
            enabled: true,
          },
          {
            restaurantId: restaurant.id,
            type: "REWARDS",
            title: "VIP Stamp Card",
            description: "Collect digital stamps with every visit for rewards",
            icon: "Award",
            url: `/r/${slug}/rewards`,
            displayOrder: 4,
            badge: "Rewards",
            enabled: true,
          },
          {
            restaurantId: restaurant.id,
            type: "FEEDBACK",
            title: "Private Guest Feedback",
            description: "Confidential feedback directly to management",
            icon: "MessageSquare",
            url: `/r/${slug}/feedback`,
            displayOrder: 5,
            badge: "Private",
            enabled: true,
          },
        ],
      });

      // Wi-Fi Config
      const cleanSsid = trimmedName.replace(/[^\w]/g, "_").slice(0, 24) + "_Guest";
      await tx.wifiConfig.create({
        data: {
          restaurantId: restaurant.id,
          ssid: cleanSsid,
          password: "",
          enabled: true,
          instructions: "Complimentary high-speed Wi-Fi access for all dining patrons.",
        },
      });

      // Loyalty Program
      const loyaltyProgram = await tx.loyaltyProgram.create({
        data: {
          restaurantId: restaurant.id,
          enabled: true,
          name: `${trimmedName} Rewards`,
        },
      });

      await tx.loyaltyMilestone.createMany({
        data: [
          {
            loyaltyProgramId: loyaltyProgram.id,
            stampRequirement: 4,
            rewardTitle: "Complimentary Artisan Beverage",
            rewardDescription: "Enjoy any specialty drink on the house.",
            validityDays: 30,
            displayOrder: 1,
            enabled: true,
          },
          {
            loyaltyProgramId: loyaltyProgram.id,
            stampRequirement: 8,
            rewardTitle: "Signature Main Course Plate",
            rewardDescription: "Receive 100% off any signature house entree.",
            validityDays: 30,
            displayOrder: 2,
            enabled: true,
          },
        ],
      });

      return restaurant;
    });

    invalidateRestaurantAccessCache();
    try {
      revalidatePath("/admin", "layout");
    } catch {}

    return NextResponse.json({ success: true, data: newRestaurant }, { status: 201 });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json({ success: false, error: "Failed to create venue" }, { status: 500 });
  }
}
