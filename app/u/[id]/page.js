import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import NavShell from "@/components/NavShell";
import ProfileClient from "@/components/ProfileClient";
import { prisma } from "@/lib/prisma";

export default async function VisitorProfilePage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const viewer = await prisma.user.findUnique({ where: { id: userId } });
  if (!viewer || !viewer.verified) redirect("/login");

  return (
    <NavShell user={viewer}>
      <ProfileClient profileId={params.id} />
    </NavShell>
  );
}