import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { slugify, sanitizeString } from "@/lib/utils";

const SignupSchema = z.object({
  name: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: result.error.errors[0]?.message || "Invalid signup input data",
          },
        },
        { status: 400 }
      );
    }

    const { name, email, password, restaurantName, phone, address } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_ALREADY_EXISTS",
            message: "An account with this email address already exists. Please sign in instead.",
          },
        },
        { status: 400 }
      );
    }

    // Generate unique slug for restaurant
    let slug = slugify(restaurantName);
    if (!slug) {
      slug = "restaurant-" + Math.random().toString(36).substring(2, 8);
    }

    const slugExists = await prisma.restaurant.findUnique({
      where: { slug },
    });

    if (slugExists) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create User, Restaurant, Membership, and Default Actions in a transaction
    const createdData = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: sanitizeString(name),
          email: normalizedEmail,
          passwordHash,
        },
      });

      // 2. Create Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: sanitizeString(restaurantName),
          slug,
          primaryColor: "#0F766E", // Deep emerald green
          secondaryColor: "#F0FDF4", // Soft green-white
          phone: phone ? sanitizeString(phone) : null,
          address: address ? sanitizeString(address) : null,
          status: "ACTIVE",
        },
      });

      // 3. Link Owner Membership
      await tx.restaurantMember.create({
        data: {
          userId: user.id,
          restaurantId: restaurant.id,
          role: "OWNER",
        },
      });

      // 4. Create Default Guest Actions
      await tx.guestAction.createMany({
        data: [
          {
            restaurantId: restaurant.id,
            type: "MENU",
            title: "Digital Dining Menu",
            description: "Explore seasonal lunch, dinner, and craft beverages",
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
            description: "Share your culinary experience with the community on Google Maps",
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
            description: "Fast, complimentary wireless internet for dining guests",
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
            description: "Collect digital stamps with every visit for complimentary dining",
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
            description: "Confidential feedback directly to the executive chef and management",
            icon: "MessageSquare",
            url: `/r/${slug}/feedback`,
            displayOrder: 5,
            badge: "Private",
            enabled: true,
          },
        ],
      });

      // 5. Create Default Wi-Fi Config
      const cleanSsid = restaurantName.replace(/[^\w]/g, "_").slice(0, 24) + "_Guest";
      await tx.wifiConfig.create({
        data: {
          restaurantId: restaurant.id,
          ssid: cleanSsid,
          password: "",
          enabled: true,
          instructions: "Complimentary high-speed Wi-Fi access for all dining patrons.",
        },
      });

      // 6. Create Default Loyalty Program with Milestones
      const loyaltyProgram = await tx.loyaltyProgram.create({
        data: {
          restaurantId: restaurant.id,
          name: "Stamp Rewards",
          enabled: true,
        },
      });

      await tx.loyaltyMilestone.createMany({
        data: [
          {
            loyaltyProgramId: loyaltyProgram.id,
            stampRequirement: 3,
            rewardTitle: "10% Off Entire Bill",
            rewardDescription: "Enjoy 10% off your table check on your next visit.",
            validityDays: 30,
            displayOrder: 1,
            enabled: true,
          },
          {
            loyaltyProgramId: loyaltyProgram.id,
            stampRequirement: 6,
            rewardTitle: "Complimentary Chef's Dessert",
            rewardDescription: "Choice of any artisanal dessert from our seasonal menu.",
            validityDays: 30,
            displayOrder: 2,
            enabled: true,
          },
          {
            loyaltyProgramId: loyaltyProgram.id,
            stampRequirement: 10,
            rewardTitle: "Complimentary Entree of Choice",
            rewardDescription: "One complimentary signature entree or house specialty.",
            validityDays: 45,
            displayOrder: 3,
            enabled: true,
          },
        ],
      });

      return {
        user: { id: user.id, email: user.email, name: user.name },
        restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: createdData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create account. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
