import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// Server-side gate: only platform admins get the platform console (its APIs check this too).
// Role comes from the database, same as /admin's routing, so a stale session can't cause a
// redirect loop and a demoted admin loses access immediately.
// Signed-out visitors are already sent to /login by the parent /admin layout.
export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    : null;
  if (user?.role !== "PLATFORM_ADMIN") {
    redirect("/admin");
  }
  return <>{children}</>;
}
