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
      from: process.env.EMAIL_FROM || "Vreedits <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend email failed (${res.status}): ${detail}`);
  }
  return res.json();
}

function codeEmailHtml(heading, code) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto;">
      <h2 style="color:#14151A;">${heading}</h2>
      <p style="color:#54565f; font-size:14px;">Use this code to continue. It expires in 10 minutes.</p>
      <div style="font-size:28px; font-weight:700; letter-spacing:0.1em; background:#F2F2F5; padding:16px; border-radius:12px; text-align:center; margin:16px 0;">
        ${code}
      </div>
      <p style="color:#8A8C99; font-size:12px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}

function ordinalSuffix(n) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

function birthdayEmailHtml(displayName, age) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto;">
      <h2 style="color:#14151A;">Happy Birthday${displayName ? `, ${displayName}` : ""}! 🎉🎂</h2>
      <p style="color:#54565f; font-size:14px; line-height:1.6;">
        Another year, another trip around the sun — and today's all about you!
        Everyone here at Vreedits is celebrating your ${age}${ordinalSuffix(age)} birthday
        and wanted to take a moment to say how glad we are to have you with us.
      </p>
      <p style="color:#54565f; font-size:14px; line-height:1.6;">
        We hope your day is filled with good food, good company, and maybe even
        a little extra cake. Thanks for being part of the Vreedits community —
        here's to another great year ahead. 🥳
      </p>
      <p style="color:#8A8C99; font-size:12px; margin-top:24px;">
        — With love from the Vreedits team
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(to, code) {
  return sendEmail({
    to,
    subject: "Verify your Vreedits account",
    html: codeEmailHtml("Verify your email", code),
  });
}

export async function sendResetEmail(to, code) {
  return sendEmail({
    to,
    subject: "Reset your Vreedits password",
    html: codeEmailHtml("Reset your password", code),
  });
}

export async function sendBirthdayEmail(to, displayName, age) {
  return sendEmail({
    to,
    subject: "Happy Birthday from Vreedits! 🎉",
    html: birthdayEmailHtml(displayName, age),
  });
}