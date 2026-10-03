import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  return <>{children}</>;
}
