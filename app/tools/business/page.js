import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import SectionDashboard from "@/components/SectionDashboard";
import { TOOLS } from "@/lib/aiTools";
import { Briefcase } from "lucide-react";

export default async function BusinessPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  const items = [
    { label: "Client Notes", sub: "Keep notes organized per client.", href: "/tools/business/clients" },
    ...TOOLS.filter((t) => t.category === "Business").map((t) => ({
      label: t.label,
      sub: t.description,
      href: `/ai-tools/${t.id}`,
    })),
  ];

  return (
    <NavShell user={user}>
      <SectionDashboard
        title="Business"
        icon={<Briefcase size={20} />}
        description="Run and grow your business in one place."
        items={items}
      />
    </NavShell>
  );
}