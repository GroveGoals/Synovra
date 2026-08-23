import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import SectionDashboard from "@/components/SectionDashboard";
import { TOOLS } from "@/lib/aiTools";
import { GraduationCap } from "lucide-react";

export default async function SchoolPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  const items = [
    { label: "Flashcards", sub: "Create decks and study them anytime.", href: "/tools/school/flashcards" },
    { label: "Assignments", sub: "Track what's due and check it off.", href: "/tools/school/assignments" },
    ...TOOLS.filter((t) => t.category === "School").map((t) => ({
      label: t.label,
      sub: t.description,
      href: `/ai-tools/${t.id}`,
    })),
  ];

  return (
    <NavShell user={user}>
      <SectionDashboard
        title="School"
        icon={<GraduationCap size={20} />}
        description="Homework, studying, and everything class-related."
        items={items}
      />
    </NavShell>
  );
}