"use client";

import { API_BASE } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function saveProfile() {
    setMsg(null);
    const res = await fetch(`${API_BASE}/profile/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fullName, email }),
    });
    const data = await res.json();
    setMsg(data.message ?? (res.ok ? "Profile updated." : "Profile update failed."));
    await refresh();
  }

  async function changePassword() {
    setMsg(null);
    const res = await fetch(`${API_BASE}/profile/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setMsg(data.message ?? (res.ok ? "Password changed." : "Password change failed."));
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  async function logoutFromProfile() {
    setMsg(null);
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      await refresh();
      router.replace("/login");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Profile</h1>
      {msg && <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground">{msg}</p>}
      <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Profile settings</h2>
        <input className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
        <input className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <p className="text-xs text-muted">Role: {user?.isAdmin ? "Admin" : "User"}</p>
        <button type="button" onClick={saveProfile} className="w-full rounded-xl bg-[rgb(var(--accent-orange))] px-4 py-2 text-sm font-semibold text-white sm:w-auto">Save profile</button>
      </section>
      <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Security</h2>
        <input type="password" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
        <input type="password" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={changePassword} className="rounded-xl border border-white/20 px-4 py-2 text-sm">Change password</button>
          <button type="button" onClick={logoutFromProfile} className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-200 hover:bg-red-950/30">Logout</button>
        </div>
      </section>
    </div>
  );
}
