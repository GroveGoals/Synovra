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
    { label: "Notes", sub: "Write notes, attach files, and turn them into flashcards.", href: "/notes" },
    { label: "Smart Tools", sub: "Turn your notes into flashcards, quizzes, summaries, and more.", href: "/tools/school/flashcards" },
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