import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function requireUser() {
  const userId = getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) return null;
  return user;
}