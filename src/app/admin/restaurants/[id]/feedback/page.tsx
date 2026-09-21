import { notFound, redirect } from "next/navigation";
import { getSession, verifyRestaurantAccess } from "@/lib/auth/session";
import { FeedbackInbox } from "@/components/admin/feedback-inbox";

export default async function FeedbackAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id: restaurantId } = await params;
  const access = await verifyRestaurantAccess(restaurantId);

  if (!access.authorized) notFound();

  return (
    <div className="animate-in fade-in duration-200">
      <FeedbackInbox restaurantId={restaurantId} />
    </div>
  );
}
