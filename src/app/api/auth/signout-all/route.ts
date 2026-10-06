import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Increment tokenVersion in the database, instantly invalidating all issued JWT tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully signed out of all devices.",
    });
  } catch (error) {
    console.error("Error signing out of all devices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sign out of all devices." },
      { status: 500 }
    );
  }
}
