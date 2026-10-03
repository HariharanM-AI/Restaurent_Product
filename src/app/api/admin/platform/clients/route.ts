import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Super admin access required" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      clientName,
      companyName,
      email,
      phone,
      password,
      plan = "GROWTH",
      shopName,
      shopSlug,
      primaryColor = "#0F766E",
    } = body;

    if (!email || !companyName) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Email and Company Name are required" } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(password || "client123", 12);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: clientName || companyName,
          phone: phone || null,
          role: Role.OWNER,
          passwordHash,
          status: "ACTIVE",
        },
      });
    }

    // Create or find ClientAccount
    let clientAccount = await prisma.clientAccount.findUnique({
      where: { userId: user.id },
    });

    if (!clientAccount) {
      clientAccount = await prisma.clientAccount.create({
        data: {
          userId: user.id,
          companyName,
          plan: plan as any,
          status: "ACTIVE",
          maxShops: 10,
        },
      });
    }

    // If shopName provided, create the initial shop
    let createdShop = null;
    if (shopName) {
      const slugCandidate = (shopSlug || shopName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure unique slug
      let finalSlug = slugCandidate;
      let counter = 1;
      while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slugCandidate}-${counter}`;
        counter++;
      }

      createdShop = await prisma.restaurant.create({
        data: {
          name: shopName,
          slug: finalSlug,
          primaryColor: primaryColor || "#0F766E",
          clientId: clientAccount.id,
          status: "ACTIVE",
        },
      });

      // Link owner in RestaurantMember
      await prisma.restaurantMember.create({
        data: {
          userId: user.id,
          restaurantId: createdShop.id,
          role: Role.OWNER,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        clientAccount,
        user: { id: user.id, name: user.name, email: user.email },
        createdShop,
      },
    });
  } catch (error: any) {
    console.error("Provision client error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to provision client" } },
      { status: 500 }
    );
  }
}
