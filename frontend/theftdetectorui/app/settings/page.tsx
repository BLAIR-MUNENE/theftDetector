"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";
import { fetchSettings } from "@/lib/api";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchSettings().then(setS);
  }, []);

  if (!s) return <p className="text-muted">Loading settings...</p>;

  async function save() {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(s),
    });
    const data = await res.json();
    setMsg(data.message ?? "Saved.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Settings</h1>
      {msg ? <p className="text-sm text-orange-400">{msg}</p> : null}
      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <input
          type="checkbox"
          checked={s.showHeatmap}
          onChange={(e) => setS({ ...s, showHeatmap: e.target.checked })}
        />
        Show heatmap overlay
      </label>
      <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white" onClick={save}>
        Save settings
      </button>
    </div>
  );
}
