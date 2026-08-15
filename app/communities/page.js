import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import CommunitiesClient from "@/components/CommunitiesClient";

export default async function CommunitiesPage() {
  const userId = getSessionUserId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect("/login");

  return (
    <NavShell user={user}>
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[480px] mt-10">
          <h1 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Communities
          </h1>
          <CommunitiesClient />
        </div>
      </div>
    </NavShell>
  );
}