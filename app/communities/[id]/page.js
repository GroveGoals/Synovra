import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import CommunityDetailClient from "@/components/CommunityDetailClient";

export default async function CommunityPage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <NavShell user={user}>
      <CommunityDetailClient communityId={params.id} currentUserId={userId} />
    </NavShell>
  );
}