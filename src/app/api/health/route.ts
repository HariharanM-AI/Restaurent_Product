import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";

  try {
    // Quick probe to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = "unreachable";
  }

  const durationMs = Date.now() - startTime;
  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      latencyMs: durationMs,
      services: {
        database: dbStatus,
        api: "healthy",
      },
      memory: process.memoryUsage(),
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
