import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and setting up SaaS platform users...");

  // 1. Ensure Super Admin / Platform Admin exists
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@noura.com" },
    update: {
      role: Role.PLATFORM_ADMIN,
    },
    create: {
      email: "admin@noura.com",
      name: "SaaS Platform Admin",
      role: Role.PLATFORM_ADMIN,
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
    },
  });

  console.log("Platform Super Admin ready:", platformAdmin.email, "Role:", platformAdmin.role);

  // 2. Fetch all existing users and restaurants
  const allUsers = await prisma.user.findMany({
    include: {
      memberships: {
        include: { restaurant: true },
      },
      clientAccount: true,
    },
  });

  console.log(`Found ${allUsers.length} total users.`);

  for (const user of allUsers) {
    if (user.role === Role.PLATFORM_ADMIN) continue;

    // Create ClientAccount if not present
    let clientAcc = user.clientAccount;
    if (!clientAcc) {
      clientAcc = await prisma.clientAccount.create({
        data: {
          userId: user.id,
          companyName: user.name ? `${user.name} Hospitality` : "Enterprise Client",
          plan: "GROWTH",
          status: "ACTIVE",
          maxShops: 10,
        },
      });
      console.log(`Created ClientAccount for user ${user.email} (${clientAcc.id})`);
    }

    // Link any restaurants owned by this user to this clientAccount
    for (const membership of user.memberships) {
      if (membership.role === Role.OWNER && membership.restaurant) {
        if (!membership.restaurant.clientId) {
          await prisma.restaurant.update({
            where: { id: membership.restaurant.id },
            data: { clientId: clientAcc.id },
          });
          console.log(`Linked shop "${membership.restaurant.name}" to client "${clientAcc.companyName}"`);
        }
      }
    }
  }

  console.log("SaaS setup completed successfully.");
}

main()
  .catch((e) => {
    console.error("Setup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
