import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
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

    // 1. Platform KPI Metrics
    const [
      totalClients,
      totalShops,
      activeShops,
      totalEngagements,
      totalLoyaltyStamps,
    ] = await Promise.all([
      prisma.clientAccount.count(),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: "ACTIVE" } }),
      prisma.analyticsEvent.count(),
      prisma.loyaltyStampTransaction.count(),
    ]);

    // 2. Fetch all clients with their respective shops
    const clientAccounts = await prisma.clientAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            status: true,
          },
        },
        shops: {
          include: {
            _count: {
              select: {
                actions: true,
                customers: true,
                feedbacks: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch all shops globally with client details
    const allShops = await prisma.restaurant.findMany({
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            actions: true,
            customers: true,
            feedbacks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalClients,
          totalShops,
          activeShops,
          suspendedShops: totalShops - activeShops,
          totalEngagements,
          totalLoyaltyStamps,
        },
        clients: clientAccounts.map((c) => ({
          id: c.id,
          userId: c.userId,
          companyName: c.companyName,
          plan: c.plan,
          status: c.status,
          maxShops: c.maxShops,
          createdAt: c.createdAt,
          user: c.user,
          shops: c.shops.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            primaryColor: s.primaryColor,
            status: s.status,
            address: s.address,
            phone: s.phone,
            createdAt: s.createdAt,
            actionsCount: s._count.actions,
            customersCount: s._count.customers,
            feedbacksCount: s._count.feedbacks,
          })),
        })),
        allShops: allShops.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          primaryColor: s.primaryColor,
          status: s.status,
          address: s.address,
          phone: s.phone,
          createdAt: s.createdAt,
          clientName: s.client?.companyName || s.client?.user?.name || "Independent Venue",
          clientEmail: s.client?.user?.email || "N/A",
          actionsCount: s._count.actions,
          customersCount: s._count.customers,
          feedbacksCount: s._count.feedbacks,
        })),
      },
    });
  } catch (error: any) {
    console.error("Platform overview error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to load platform data" } },
      { status: 500 }
    );
  }
}
