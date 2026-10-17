import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { slugify, sanitizeString } from "@/lib/utils";
import { getDefaultGuestActions } from "@/lib/constants/default-actions";

interface StarterVenueInput {
  name: string;
  email: string;
  passwordHash: string;
  venueName?: string | null;
  phone?: string | null;
  address?: string | null;
}

/**
 * Creates an OWNER user plus a complete starter venue (restaurant, membership, default
 * guest actions, Wi-Fi config, loyalty program + milestones) in one transaction.
 * Shared by email signup and Google first-time sign-in so both produce the same account shape.
 * Caller is responsible for rate limiting and the "email already exists" check.
 */
export async function createOwnerWithStarterVenue(input: StarterVenueInput) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const resolvedVenueName = input.venueName?.trim() || `${input.name.trim()}'s Venue`;

  let slug = slugify(resolvedVenueName);
  if (!slug) slug = "venue-" + crypto.randomBytes(3).toString("hex");
  if (await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: sanitizeString(input.name), email: normalizedEmail, passwordHash: input.passwordHash },
    });

    const restaurant = await tx.restaurant.create({
      data: {
        name: sanitizeString(resolvedVenueName),
        slug,
        primaryColor: "#0F766E",
        secondaryColor: "#F0FDF4",
        phone: input.phone ? sanitizeString(input.phone) : null,
        address: input.address ? sanitizeString(input.address) : null,
        status: "ACTIVE",
      },
    });

    await tx.restaurantMember.create({
      data: { userId: user.id, restaurantId: restaurant.id, role: "OWNER" },
    });

    await tx.guestAction.createMany({ data: getDefaultGuestActions(restaurant.id, slug) });

    const cleanSsid = resolvedVenueName.replace(/[^\w]/g, "_").slice(0, 24) + "_Guest";
    await tx.wifiConfig.create({
      data: {
        restaurantId: restaurant.id,
        ssid: cleanSsid,
        password: "",
        enabled: true,
        instructions: "Complimentary high-speed Wi-Fi access for all dining patrons.",
      },
    });

    const loyaltyProgram = await tx.loyaltyProgram.create({
      data: { restaurantId: restaurant.id, name: "Stamp Rewards", enabled: true },
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
}

/**
 * Finds the owner account for a Google email, provisioning a starter venue on first sign-in.
 * Google verifies the email, so matching an existing email/password account by email is
 * intentional account linking. These accounts get a random, unusable password hash — they
 * sign in only through Google.
 */
export async function findOrCreateOAuthUser(email: string, displayName?: string | null): Promise<{ id: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
  const { user } = await createOwnerWithStarterVenue({
    name: displayName?.trim() || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    passwordHash,
  });
  return { id: user.id };
}
