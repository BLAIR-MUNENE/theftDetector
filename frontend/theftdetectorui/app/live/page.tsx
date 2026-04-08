"use client";

import { useEffect, useState } from "react";
import { getWsUrl } from "@/lib/config";
import type { WsMultiFrame } from "@/lib/types";

export default function LivePage() {
  const [feeds, setFeeds] = useState<WsMultiFrame["cameras"]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(getWsUrl());
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMultiFrame;
        if (data.type === "multi_frame") setFeeds(data.cameras ?? []);
      } catch {}
    };
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Live Feeds</h1>
      <p className="text-sm text-muted">{connected ? "Connected to stream." : "Connecting to stream..."}</p>
      {feeds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 p-8 text-muted">No active camera frames yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {feeds.map((cam) => (
            <div key={cam.camera_id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <div className="border-b border-white/10 p-2 text-sm">{cam.name}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:image/jpeg;base64,${cam.data}`} alt={cam.name} className="aspect-video w-full object-contain" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
