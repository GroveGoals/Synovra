"use client";
import Link from "next/link";
import { User, Settings, HelpCircle, Phone, ChevronRight } from "lucide-react";

export default function DashboardClient({ user }) {
  const quickActions = [
    { label: "Edit Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help Center", href: "/help", icon: HelpCircle },
    { label: "Contact Us", href: "/contact", icon: Phone },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-[480px] mt-10">
        <div className="flex items-center gap-4 mb-8">
          {user.avatarDataUrl ? (
            <img
              src={user.avatarDataUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 2px var(--border)" }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "var(--font-display)" }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Welcome back, {user.username}
            </h1>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {user.online ? "Online now" : "Offline"}
            </div>
          </div>
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
          Quick actions
        </h2>
        <div className="card" style={{ padding: 6 }}>
          {quickActions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                borderBottom: i < quickActions.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <action.icon size={16} />
                {action.label}
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}