import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@/types";

// React cache() memoizes getSession per server request lifecycle
export const getSession = cache(async () => {
  return await getServerSession(authOptions);
});

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return user;
}

export interface AccessCheckResult {
  authorized: boolean;
  role?: string;
  restaurantId?: string;
  restaurant?: any;
  error?: string;
}

// In-memory cache for fast sub-millisecond page transitions
const membershipCache = new Map<
  string,
  {
    membership: any;
    expiresAt: number;
  }
>();

const primaryMembershipCache = new Map<
  string,
  {
    membership: any;
    expiresAt: number;
  }
>();

export function invalidateRestaurantAccessCache(restaurantId?: string) {
  if (restaurantId) {
    for (const key of membershipCache.keys()) {
      if (key.endsWith(`:${restaurantId}`)) {
        membershipCache.delete(key);
      }
    }
    for (const [userId, entry] of primaryMembershipCache.entries()) {
      if (
        entry.membership?.restaurantId === restaurantId ||
        entry.membership?.restaurant?.id === restaurantId
      ) {
        primaryMembershipCache.delete(userId);
      }
    }
  } else {
    membershipCache.clear();
    primaryMembershipCache.clear();
  }
}

/**
 * Enforces server-side zero-trust multi-tenant authorization.
 * Uses in-memory caching (30s TTL) to prevent repetitive slow cloud database queries on every page transition.
 */
export async function verifyRestaurantAccess(
  restaurantId: string,
  allowedRoles: Role[] = ["PLATFORM_ADMIN", "OWNER", "MANAGER", "STAFF"]
): Promise<AccessCheckResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized. Please sign in." };
  }

  const cacheKey = `${session.user.id}:${restaurantId}`;
  const now = Date.now();
  const cached = membershipCache.get(cacheKey);

  let membership = cached && cached.expiresAt > now ? cached.membership : null;

  if (!membership) {
    membership = await prisma.restaurantMember.findUnique({
      where: {
        userId_restaurantId: {
          userId: session.user.id,
          restaurantId,
        },
      },
      include: {
        restaurant: true,
      },
    });

    if (membership) {
      membershipCache.set(cacheKey, {
        membership,
        expiresAt: now + 30_000, // 30 seconds TTL
      });
    }
  }

  if (!membership) {
    return { authorized: false, error: "Access denied. You are not a member of this restaurant." };
  }

  if (!allowedRoles.includes(membership.role as Role)) {
    return { authorized: false, error: "Insufficient permissions for this operation." };
  }

  return {
    authorized: true,
    role: membership.role,
    restaurantId: membership.restaurantId,
    restaurant: membership.restaurant,
  };
}

/**
 * Fast lookup of the user's primary restaurant with 30s cache.
 */
export async function getUserPrimaryMembership(userId: string) {
  const now = Date.now();
  const cached = primaryMembershipCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.membership;
  }

  const membership = await prisma.restaurantMember.findFirst({
    where: { userId },
    include: {
      restaurant: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    primaryMembershipCache.set(userId, {
      membership,
      expiresAt: now + 30_000,
    });
  }

  return membership;
}

export async function getUserRestaurants(userId: string) {
  const memberships = await prisma.restaurantMember.findMany({
    where: { userId },
    include: {
      restaurant: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    ...m.restaurant,
    memberRole: m.role,
  }));
}
