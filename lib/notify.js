import { prisma } from "@/lib/prisma";

export async function notify(userId, { category, title, description }) {
  await prisma.notification.create({
    data: { userId, category, title, description },
  });
}