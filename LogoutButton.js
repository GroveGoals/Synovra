"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn-primary max-w-[200px] mx-auto" onClick={handleLogout}>
      <LogOut size={15} /> Logout
    </button>
  );
}
