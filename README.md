# Synovra — V1, Phase 1 (Auth)

Real, working auth system: register, login, logout, email verification,
forgot/reset password. Next.js (App Router) + Prisma + Postgres.

## What's real here
- Passwords hashed with bcrypt, never stored in plain text
- Real verification/reset codes emailed via Resend
- Real sessions via signed httpOnly JWT cookies
- Real brute-force lockout (5 failed logins → 15 min lock)
- Username availability checked live against the real database

## 1. Get your two accounts

1. **Neon** (https://neon.tech) — grab the **pooled connection string**
   (hostname includes `-pooler`) from your project's Connection Details.
2. **Resend** (https://resend.com) — API Keys → Create API Key → copy it
   immediately, it's shown only once.

## 2. Local setup (optional, to test before deploying)

```bash
cp .env.example .env
# paste your real DATABASE_URL and RESEND_API_KEY into .env
npm install
npx prisma migrate dev --name init
npm run dev
```

Visit http://localhost:3000 — it should redirect you to /login.

## 3. Push to GitHub

Unzip this project, then upload/replace everything inside the `synovra`
folder into your GitHub repo (GitHub overwrites matching files
automatically; delete `lib/email.js` manually first if it's stuck as a
leftover from a previous version — this version needs it back, so ignore
that if you're uploading fresh).

## 4. Deploy on Render

1. Web Service → connect your GitHub repo.
2. **Runtime: Node** (not Docker — there is no Dockerfile in this project).
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment tab → add:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon pooled connection string |
   | `RESEND_API_KEY` | your Resend API key |
   | `EMAIL_FROM` | `Synovra <onboarding@resend.dev>` |
   | `JWT_SECRET` | any long random string |

6. Deploy, then run once against your live database:
   ```bash
   npx prisma migrate deploy
   ```

## Important limitation (Resend sandbox)

Until you verify your own domain in Resend, you can only send email to the
address you signed up to Resend with, from `onboarding@resend.dev`. Fine
for testing solo — verify a domain later to email real users.

## Not built yet (later phases, per the V1 plan)

- Profile system (avatar upload, edit profile, country/language, public/private)
- Nav shell (hamburger menu) + real dashboard
- AI tools, search, favorites, history, collections
- Communities, posts, notifications
- Premium + Flutterwave payments
- Admin dashboard + analytics
- i18n, final security hardening
