import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";

export default async function DashboardPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <NavShell user={user}>
      <div className="min-h-screen flex flex-col items-center px-4">
        <div className="w-full max-w-[420px] text-center mt-16">
          <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Welcome back, {user.username}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Real account, real database, real session. Use the menu to check
            out your profile and settings — the rest of the menu lights up
            as each phase gets built.
          </p>
        </div>
      </div>
    </NavShell>
  );
}