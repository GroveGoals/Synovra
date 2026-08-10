
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import AiToolsClient from "@/components/AiToolsClient";
import { TOOLS } from "@/lib/aiTools";

export default async function AiToolsPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <NavShell user={user}>
      <AiToolsClient tools={TOOLS} />
    </NavShell>
  );
}