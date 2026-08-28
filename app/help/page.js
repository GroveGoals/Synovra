import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavShell from "@/components/NavShell";

const FAQS = [
  { q: "How do I reset my password?", a: "Go to the login page and tap \"Forgot password?\" — you'll get a code by email to set a new one." },
  { q: "How do I change my username?", a: "Go to My Profile from the menu, update your username, and save." },
  { q: "How do I upload a profile picture?", a: "On My Profile, tap the camera icon on your avatar and choose a photo." },
  { q: "Is vreedits free?", a: "Yes — core features are free. Premium plans are coming soon." },
];

export default async function HelpPage() {
  const userId = getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

  return (
    <NavShell user={user}>
      <div className="min-h-screen flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-[480px] mt-10">
          <h1 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Help Center
          </h1>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <div key={i} className="card p-4">
                <div className="text-sm font-semibold mb-1">{item.q}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NavShell>
  );
}