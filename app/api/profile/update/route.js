import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const DISPLAY_NAME_COOLDOWN = 5 * 24 * 60 * 60 * 1000;
const USERNAME_COOLDOWN = 14 * 24 * 60 * 60 * 1000;

function isValidUsername(username) {
  return /^[a-z][a-z0-9._-]{2,29}$/.test(username);
}

function isValidDisplayName(displayName) {
  return /^[\p{L}\p{N}][\p{L}\p{N} ._'’-]{0,49}$/u.test(
    displayName
  );
}

function getRemainingTime(lastChangedAt, cooldown) {
  if (!lastChangedAt) return 0;

  const elapsed =
    Date.now() - new Date(lastChangedAt).getTime();

  return Math.max(0, cooldown - elapsed);
}

function formatRemainingTime(ms) {
  const days = Math.ceil(
    ms / (24 * 60 * 60 * 1000)
  );

  return `${days} day${days === 1 ? "" : "s"}`;
}

export async function PATCH(req) {
  try {
    const userId = getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const requestedUsername =
      typeof body.username === "string"
        ? body.username.trim()
        : null;

    const requestedDisplayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : null;

    if (
      requestedUsername === null &&
      requestedDisplayName === null
    ) {
      return NextResponse.json(
        {
          error:
            "Provide a username or display name to update.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const data = {};

    // -----------------------------
    // DISPLAY NAME
    // -----------------------------

    if (requestedDisplayName !== null) {
      if (!isValidDisplayName(requestedDisplayName)) {
        return NextResponse.json(
          {
            error:
              "Display name must be 1–50 characters and can contain letters, numbers, spaces, periods, apostrophes, and hyphens.",
          },
          { status: 400 }
        );
      }

      if (
        requestedDisplayName === user.displayName
      ) {
        return NextResponse.json(
          {
            error:
              "That's already your display name.",
          },
          { status: 400 }
        );
      }

      const remaining =
        getRemainingTime(
          user.displayNameChangedAt,
          DISPLAY_NAME_COOLDOWN
        );

      if (remaining > 0) {
        return NextResponse.json(
          {
            error: `You can change your display name again in ${formatRemainingTime(
              remaining
            )}.`,
            retryAfterMs: remaining,
          },
          { status: 429 }
        );
      }

      data.displayName =
        requestedDisplayName;

      data.displayNameChangedAt =
        new Date();
    }

    // -----------------------------
    // USERNAME
    // -----------------------------

    if (requestedUsername !== null) {
      if (!isValidUsername(requestedUsername)) {
        return NextResponse.json(
          {
            error:
              "Username must start with a lowercase letter and can contain lowercase letters, numbers, periods, underscores, or hyphens. It must be 3–30 characters.",
          },
          { status: 400 }
        );
      }

      if (
        requestedUsername === user.username
      ) {
        return NextResponse.json(
          {
            error:
              "That's already your username.",
          },
          { status: 400 }
        );
      }

      const remaining =
        getRemainingTime(
          user.usernameChangedAt,
          USERNAME_COOLDOWN
        );

      if (remaining > 0) {
        return NextResponse.json(
          {
            error: `You can change your username again in ${formatRemainingTime(
              remaining
            )}.`,
            retryAfterMs: remaining,
          },
          { status: 429 }
        );
      }

      const existing =
        await prisma.user.findUnique({
          where: {
            username: requestedUsername,
          },
          select: {
            id: true,
          },
        });

      if (
        existing &&
        existing.id !== user.id
      ) {
        return NextResponse.json(
          {
            error:
              "That username is already taken.",
          },
          { status: 409 }
        );
      }

      data.username =
        requestedUsername;

      data.usernameChangedAt =
        new Date();
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data,

        select: {
          id: true,
          username: true,
          displayName: true,
        },
      });

    return NextResponse.json({
      ok: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error(
      "Profile update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update your profile right now.",
      },
      { status: 500 }
    );
  }
}