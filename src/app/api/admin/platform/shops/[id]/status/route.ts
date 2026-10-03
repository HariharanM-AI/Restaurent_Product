import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { status } = body;

    if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid status value" } },
        { status: 400 }
      );
    }

    const updatedShop = await prisma.restaurant.update({
      where: { id },
      data: { status: status as any },
    });

    return NextResponse.json({
      success: true,
      data: { shop: updatedShop },
    });
  } catch (error: any) {
    console.error("Update shop status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update shop status" } },
      { status: 500 }
    );
  }
}
