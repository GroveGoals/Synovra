import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col items-center px-4">
      <div className="w-full max-w-[420px] text-center mt-16">
        <div
          className="w-[72px] h-[72px] rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-semibold"
          style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "var(--font-display)" }}
        >
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back, {user.username}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          You&apos;re logged in and verified against the real database. This is
          a placeholder — the real dashboard, nav shell, and profile screens
          are Phase 2.
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}