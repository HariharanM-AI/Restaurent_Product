import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createOwnerWithStarterVenue } from "@/lib/auth/provision";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const SignupSchema = z.object({
  name: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(10, "Password must be at least 10 characters"),
  restaurantName: z.string().optional().nullable(),
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

    // Throttle account creation per client IP and per email address
    const SIGNUP_WINDOW = 60 * 60 * 1000;
    const ip = getClientIp(req.headers);
    const [byIp, byEmail] = await Promise.all([
      rateLimit(`signup_ip_${ip}`, { limit: 5, windowMs: SIGNUP_WINDOW }),
      rateLimit(`signup_email_${email.toLowerCase().trim()}`, { limit: 3, windowMs: SIGNUP_WINDOW }),
    ]);
    if (!byIp.success || !byEmail.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMITED", message: "Too many sign-up attempts. Please try again later." },
        },
        { status: 429 }
      );
    }
    const resolvedVenueName = restaurantName?.trim() || `${name.trim()}'s Venue`;
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

    // Hash password, then create the owner + starter venue (shared with Google sign-in)
    const passwordHash = await bcrypt.hash(password, 12);
    const createdData = await createOwnerWithStarterVenue({
      name,
      email: normalizedEmail,
      passwordHash,
      venueName: resolvedVenueName,
      phone,
      address,
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
