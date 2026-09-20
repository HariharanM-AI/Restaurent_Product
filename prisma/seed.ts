import { PrismaClient, ActionType, SocialPlatform, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Platform & Restaurant Admin User
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@barlowfields.com" },
    update: {},
    create: {
      email: "admin@barlowfields.com",
      name: "Marcus Vance",
      passwordHash,
    },
  });

  console.log(`Created admin user: ${user.email} (password: password123)`);

  // 2. Create Restaurant: Barlow & Fields
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "barlow-and-fields" },
    update: {},
    create: {
      name: "Barlow & Fields",
      slug: "barlow-and-fields",
      tagline: "Locally sourced rustic kitchen & craft cocktail lounge",
      primaryColor: "#0F766E",
      secondaryColor: "#F8FAFC",
      address: "428 Market Street, Suite 100",
      phone: "(555) 234-8901",
      website: "https://barlowandfields.com",
      status: "ACTIVE",
    },
  });

  console.log(`Created restaurant: ${restaurant.name} (/r/${restaurant.slug})`);

  // 3. Create Restaurant Membership (OWNER)
  await prisma.restaurantMember.upsert({
    where: {
      userId_restaurantId: {
        userId: user.id,
        restaurantId: restaurant.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      restaurantId: restaurant.id,
      role: "OWNER",
    },
  });

  // 4. Create Wi-Fi Config
  await prisma.wifiConfig.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      ssid: "Barlow_Guest_5G",
      password: "harvestkitchen2026",
      enabled: true,
      instructions: "Connect to Barlow_Guest_5G. Fast, complimentary access for all dining guests.",
    },
  });

  // 5. Create Core Guest Actions (No emojis, Lucide icon keys)
  const actions: Array<{
    type: ActionType;
    title: string;
    description: string;
    icon: string;
    url: string;
    displayOrder: number;
    badge?: string;
  }> = [
    {
      type: "REWARDS",
      title: "Start Earning Rewards",
      description: "Collect digital stamps with every checkout for complimentary rewards",
      icon: "Award",
      url: `/r/${restaurant.slug}/rewards`,
      displayOrder: 1,
      badge: "Loyalty",
    },
    {
      type: "REVIEW",
      title: "Leave a Google Review",
      description: "Share your culinary experience with the community",
      icon: "Star",
      url: "https://maps.google.com/?cid=1234567890",
      displayOrder: 2,
      badge: "Feedback",
    },
    {
      type: "MENU",
      title: "View Menu",
      description: "Explore seasonal farm-to-table lunch, dinner, and cocktails",
      icon: "UtensilsCrossed",
      url: `/r/${restaurant.slug}/menu`,
      displayOrder: 3,
      badge: "Spring 2026",
    },
    {
      type: "WIFI",
      title: "Connect to Wi-Fi",
      description: "High-speed complimentary wireless internet for guests",
      icon: "Wifi",
      url: `/r/${restaurant.slug}/wifi`,
      displayOrder: 4,
    },
    {
      type: "FEEDBACK",
      title: "Leave Anonymous Feedback",
      description: "Send direct, private feedback to our executive chef and managers",
      icon: "MessageSquarePlus",
      url: `/r/${restaurant.slug}/feedback`,
      displayOrder: 5,
    },
    {
      type: "GAME",
      title: "Play Sudoku",
      description: "Enjoy a relaxing classic puzzle while waiting for your course",
      icon: "Gamepad2",
      url: `/r/${restaurant.slug}/game`,
      displayOrder: 6,
    },
  ];

  for (const action of actions) {
    const existing = await prisma.guestAction.findFirst({
      where: {
        restaurantId: restaurant.id,
        title: action.title,
      },
    });

    if (!existing) {
      await prisma.guestAction.create({
        data: {
          restaurantId: restaurant.id,
          type: action.type,
          title: action.title,
          description: action.description,
          icon: action.icon,
          url: action.url,
          displayOrder: action.displayOrder,
          badge: action.badge,
          enabled: true,
        },
      });
    }
  }

  // 6. Create Social Links
  const socials: Array<{
    platform: SocialPlatform;
    url: string;
    displayOrder: number;
  }> = [
    { platform: "INSTAGRAM", url: "https://instagram.com/barlowandfields", displayOrder: 1 },
    { platform: "FACEBOOK", url: "https://facebook.com/barlowandfields", displayOrder: 2 },
    { platform: "WEBSITE", url: "https://barlowandfields.com", displayOrder: 3 },
  ];

  for (const social of socials) {
    const existing = await prisma.socialLink.findFirst({
      where: {
        restaurantId: restaurant.id,
        platform: social.platform,
      },
    });

    if (!existing) {
      await prisma.socialLink.create({
        data: {
          restaurantId: restaurant.id,
          platform: social.platform,
          url: social.url,
          displayOrder: social.displayOrder,
          enabled: true,
        },
      });
    }
  }

  // 7. Create Loyalty Program & Milestones
  let loyaltyProgram = await prisma.loyaltyProgram.findUnique({
    where: { restaurantId: restaurant.id },
  });

  if (!loyaltyProgram) {
    loyaltyProgram = await prisma.loyaltyProgram.create({
      data: {
        restaurantId: restaurant.id,
        name: "The Harvest Stamp Club",
        enabled: true,
      },
    });
  }

  const milestones = [
    {
      stampRequirement: 5,
      rewardTitle: "Free Signature Beverage",
      rewardDescription: "Choice of any specialty cold brew, pour-over, mocktail, or craft soda",
      validityDays: 30,
      displayOrder: 1,
    },
    {
      stampRequirement: 10,
      rewardTitle: "Artisan Dessert on Us",
      rewardDescription: "House-made seasonal tart, warm dark chocolate torte, or honey panna cotta",
      validityDays: 45,
      displayOrder: 2,
    },
    {
      stampRequirement: 15,
      rewardTitle: "Chef's Table Appetizer Board",
      rewardDescription: "Local farmhouse cheeses, cured meats, house pickles, and grilled sourdough",
      validityDays: 60,
      displayOrder: 3,
    },
  ];

  for (const milestone of milestones) {
    const existing = await prisma.loyaltyMilestone.findFirst({
      where: {
        loyaltyProgramId: loyaltyProgram.id,
        stampRequirement: milestone.stampRequirement,
      },
    });

    if (!existing) {
      await prisma.loyaltyMilestone.create({
        data: {
          loyaltyProgramId: loyaltyProgram.id,
          stampRequirement: milestone.stampRequirement,
          rewardTitle: milestone.rewardTitle,
          rewardDescription: milestone.rewardDescription,
          validityDays: milestone.validityDays,
          displayOrder: milestone.displayOrder,
          enabled: true,
        },
      });
    }
  }

  // 8. Create a Demo Checkout Loyalty Session (Token: "demo-checkout-token-2026")
  const demoRawToken = "demo-checkout-token-2026";
  const demoTokenHash = crypto.createHash("sha256").update(demoRawToken).digest("hex");

  await prisma.loyaltyCheckoutSession.upsert({
    where: { tokenHash: demoTokenHash },
    update: {},
    create: {
      restaurantId: restaurant.id,
      tokenHash: demoTokenHash,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  console.log(`Created demo checkout session token: ${demoRawToken}`);
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
