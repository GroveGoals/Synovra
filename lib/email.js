export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it in Render's Environment tab — see README.md."
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.EMAIL_FROM ||
        "Synovra <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Resend email failed (${res.status}): ${detail}`
    );
  }

  return res.json();
}

function codeEmailHtml(heading, code) {
  return `
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      max-width:420px;
      margin:0 auto;
    ">
      <h2 style="color:#14151A;">
        ${heading}
      </h2>

      <p style="color:#54565f;font-size:14px;">
        Use this code to continue. It expires in 10 minutes.
      </p>

      <div style="
        font-size:28px;
        font-weight:700;
        letter-spacing:0.1em;
        background:#F2F2F5;
        padding:16px;
        border-radius:12px;
        text-align:center;
        margin:16px 0;
      ">
        ${code}
      </div>

      <p style="color:#8A8C99;font-size:12px;">
        If you didn't request this, you can ignore this email.
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(to, code) {
  return sendEmail({
    to,
    subject: "Verify your Synovra account",
    html: codeEmailHtml("Verify your email", code),
  });
}

export async function sendResetEmail(to, code) {
  return sendEmail({
    to,
    subject: "Reset your Synovra password",
    html: codeEmailHtml("Reset your password", code),
  });
}

function getOrdinal(number) {
  const lastTwo = number % 100;

  if (lastTwo >= 11 && lastTwo <= 13) {
    return "th";
  }

  switch (number % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function birthdayEmailHtml(displayName, age) {
  const safeName = String(displayName)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  return `
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      max-width:560px;
      margin:0 auto;
      padding:32px 20px;
      color:#14151A;
    ">

      <div style="
        background:#F5F3FF;
        border-radius:24px;
        padding:32px;
        text-align:center;
      ">

        <div style="font-size:48px;">
          🎂
        </div>

        <h1 style="margin:16px 0 8px;">
          Happy Birthday, ${safeName}! 🎉
        </h1>

        <p style="
          color:#54565f;
          font-size:16px;
          line-height:1.6;
        ">
          Syna wishes you an amazing
          ${age}${getOrdinal(age)} birthday!
        </p>

        <p style="
          color:#54565f;
          font-size:15px;
          line-height:1.6;
        ">
          We hope you have an incredible day
          and a wonderful year ahead.
        </p>

        <div style="
          margin-top:24px;
          font-size:14px;
          color:#8A8C99;
        ">
          — Syna 🤖💜
        </div>

      </div>

    </div>
  `;
}

export async function sendBirthdayEmail(
  to,
  displayName,
  age
) {
  return sendEmail({
    to,
    subject: `🎂 Happy Birthday, ${displayName}!`,
    html: birthdayEmailHtml(displayName, age),
  });
}