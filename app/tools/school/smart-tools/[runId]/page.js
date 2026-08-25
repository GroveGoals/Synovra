import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import StudyToolResultClient from "@/components/StudyToolResultClient";

export default async function StudyToolResultPage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <NavShell user={user}>
      <StudyToolResultClient runId={params.runId} />
    </NavShell>
  );
}