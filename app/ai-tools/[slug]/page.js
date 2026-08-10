
import { redirect, notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import AiToolRunner from "@/components/AiToolRunner";
import { getTool } from "@/lib/aiTools";

export default async function AiToolPage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  const tool = getTool(params.slug);
  if (!tool) notFound();

  return (
    <NavShell user={user}>
      <AiToolRunner tool={tool} />
    </NavShell>
  );
}