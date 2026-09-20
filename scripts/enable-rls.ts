import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Enabling Row Level Security (RLS) on all public tables...");

  const tables: { tablename: string }[] = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  `;

  console.log(`Found ${tables.length} tables in public schema.`);

  for (const { tablename } of tables) {
    if (tablename === "_prisma_migrations") {
      continue;
    }
    console.log(`Enabling RLS on public."${tablename}"...`);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "public"."${tablename}" ENABLE ROW LEVEL SECURITY;`
    );
  }

  console.log("All tables in public schema now have Row Level Security (RLS) enabled!");
}

main()
  .catch((e) => {
    console.error("Error enabling RLS:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
