import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";
import InviteLandingClient from "./InviteLandingClient";

export default async function InvitePage({ params }) {
  const userId = getSessionUserId();
  if (!userId) redirect(`/login?redirect=/invite/${params.code}`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) redirect(`/login?redirect=/invite/${params.code}`);

  return (
    <NavShell user={user}>
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[420px] mt-10">
          <InviteLandingClient code={params.code} />
        </div>
      </div>
    </NavShell>
  );
}
