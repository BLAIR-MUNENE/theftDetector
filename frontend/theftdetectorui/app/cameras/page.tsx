"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";

type Camera = { id: string; name: string; source: string; status: string };

export default function CamerasPage() {
  const [cams, setCams] = useState<Camera[]>([]);

  async function reload() {
    const res = await fetch(`${API_BASE}/cameras`, { credentials: "include" });
    setCams(await res.json());
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Cameras</h1>
      {cams.map((c) => (
        <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-muted">{c.source}</p>
        </div>
      ))}
      {cams.length === 0 ? <p className="text-muted">No configured cameras.</p> : null}
    </div>
  );
}
