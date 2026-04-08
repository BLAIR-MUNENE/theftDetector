"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/config";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.status === "success") {
      await refresh();
      router.replace("/");
      return;
    }
    setMsg(data.message ?? "Login failed");
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
      <h1 className="mb-4 text-2xl font-semibold">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg ? <p className="text-sm text-red-400">{msg}</p> : null}
        <button type="submit" className="w-full rounded-lg bg-orange-500 py-2 font-medium text-white">Sign in</button>
      </form>
      <p className="mt-4 text-sm text-muted">
        No account? <Link href="/signup" className="text-orange-400">Create one</Link>
      </p>
    </div>
  );
}
