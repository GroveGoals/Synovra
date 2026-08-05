// Real outbound email via Resend (https://resend.com). No SDK dependency —
// just their plain REST endpoint, so this has no extra install footprint.
//
// On Resend's free/sandbox tier (no verified custom domain), you can only
// send to the email address you signed up to Resend with, using their
// shared sender "onboarding@resend.dev". Verify your own domain in Resend
// to send to real users. See README.md.

async function sendEmail({ to, subject, html }) {
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
      from: process.env.EMAIL_FROM || "Synovra <onboarding@resend.dev>",
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
