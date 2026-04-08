"use client";

import { API_BASE } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  role: "admin" | "user";
};

export default function AdminUsersPage() {
  const { loading, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const isAdmin = Boolean(user?.isAdmin);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (isAdmin) {
      fetch(`${API_BASE}/auth/admin/users`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch(() => setMsg("Failed to load users."));
    }
  }, [loading, isAdmin, router]);

  async function toggleRole(target: AdminUser) {
    const res = await fetch(`${API_BASE}/auth/admin/users/${target.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isAdmin: !target.isAdmin }),
    });
    const data = await res.json();
    setMsg(data.message ?? (res.ok ? "Role updated." : "Role update failed."));
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, isAdmin: !u.isAdmin, role: !u.isAdmin ? "admin" : "user" } : u)));
    }
  }

  if (loading || !isAdmin) return <div className="text-sm text-muted">Checking access...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">User Management</h1>
      {msg && <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground">{msg}</p>}
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div>
              <p className="font-medium text-foreground">{u.fullName || u.username}</p>
              <p className="text-xs text-muted">{u.email} • {u.role}</p>
            </div>
            <button type="button" onClick={() => toggleRole(u)} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm">
              Make {u.isAdmin ? "User" : "Admin"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
