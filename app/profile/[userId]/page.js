import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import PublicProfileClient from "@/components/PublicProfileClient";

export default async function PublicProfilePage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");

  // Viewing your own profile just goes to your existing edit page — no need for two versions.
  if (userId === params.userId) redirect("/profile");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <NavShell user={user}>
      <PublicProfileClient userId={params.userId} />
    </NavShell>
  );
}