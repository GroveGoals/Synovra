import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBirthdayEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function calculateAge(dateOfBirth, today = new Date()) {
  const birth = new Date(dateOfBirth);

  let age =
    today.getUTCFullYear() -
    birth.getUTCFullYear();

  const birthdayNotReached =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (
      today.getUTCMonth() === birth.getUTCMonth() &&
      today.getUTCDate() < birth.getUTCDate()
    );

  if (birthdayNotReached) {
    age--;
  }

  return age;
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (
      !process.env.CRON_SECRET ||
      authHeader !==
        `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const year = now.getUTCFullYear();

    const users = await prisma.user.findMany({
      where: {
        dateOfBirth: {
          not: null,
        },

        birthdayEmailEnabled: true,

        OR: [
          {
            lastBirthdayEmailYear: null,
          },
          {
            lastBirthdayEmailYear: {
              not: year,
            },
          },
        ],
      },

      select: {
        id: true,
        email: true,
        displayName: true,
        dateOfBirth: true,
      },
    });

    const birthdayUsers = users.filter((user) => {
      const dob = new Date(user.dateOfBirth);

      return (
        dob.getUTCMonth() === month &&
        dob.getUTCDate() === day
      );
    });

    const results = [];

    for (const user of birthdayUsers) {
      const age = calculateAge(
        user.dateOfBirth,
        now
      );

      try {
        await sendBirthdayEmail(
          user.email,
          user.displayName,
          age
        );

        await prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            lastBirthdayEmailYear: year,
          },
        });

        results.push({
          userId: user.id,
          sent: true,
        });
      } catch (error) {
        console.error(
          `Birthday email failed for ${user.email}:`,
          error
        );

        results.push({
          userId: user.id,
          sent: false,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      date: now.toISOString(),
      birthdaysFound: birthdayUsers.length,
      results,
    });

  } catch (error) {
    console.error(
      "Birthday cron error:",
      error
    );

    return NextResponse.json(
      {
        error: "Birthday job failed.",
      },
      { status: 500 }
    );
  }
}