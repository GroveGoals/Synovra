import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import SectionDashboard from "@/components/SectionDashboard";
import { TOOLS } from "@/lib/aiTools";
import { PenLine } from "lucide-react";

export default async function WritingPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  const items = TOOLS.filter((t) => t.category === "Writing").map((t) => ({
    label: t.label,
    sub: t.description,
    href: `/ai-tools/${t.id}`,
  }));

  return (
    <NavShell user={user}>
      <SectionDashboard
        title="Writing"
        icon={<PenLine size={20} />}
        description="Draft, polish, and generate writing of any kind."
        items={items}
      />
    </NavShell>
  );
}