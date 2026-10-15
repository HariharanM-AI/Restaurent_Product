import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

// Never sign sessions with a guessable secret. `next build` evaluates this module
// without runtime env, so only enforce once the server is actually running.
if (!authSecret && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) must be set in production.");
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: authSecret,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Throttle password guessing per client IP and per targeted account
        const SIGN_IN_WINDOW = 15 * 60 * 1000;
        const email = credentials.email.toLowerCase().trim();
        const ip = getClientIp(req?.headers as Record<string, string> | undefined);
        const [byIp, byEmail] = await Promise.all([
          rateLimit(`signin_ip_${ip}`, { limit: 30, windowMs: SIGN_IN_WINDOW }),
          rateLimit(`signin_email_${email}`, { limit: 10, windowMs: SIGN_IN_WINDOW }),
        ]);
        if (!byIp.success || !byEmail.success) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: {
                restaurant: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tokenVersion: user.tokenVersion ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "OWNER";
        token.image = (user as any).image || null;
        token.tokenVersion = (user as any).tokenVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.image = (token.image as string) || null;
        (session.user as any).role = (token.role as string) || "OWNER";
        (session.user as any).tokenVersion = (token.tokenVersion as number) ?? 0;
      }
      return session;
    },
  },
};
