"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, alertImageUrl } from "@/lib/config";
import { Loader2, UploadCloud, RefreshCw, CheckCircle2, XCircle, Clock, X, Download } from "lucide-react";
import { fetchHistory, type HistoryRow } from "@/lib/api";

type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  message: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  alertsCreated: number;
  modelFamily?: string | null;
  weightsPath?: string | null;
};

function formatModelLabel(family: string | null | undefined): string {
  if (!family) return "—";
  if (family === "yolov26") return "YOLOv26";
  if (family === "yolov8") return "YOLOv8";
  return family;
}

function shortPath(path: string, max = 52): string {
  if (path.length <= max) return path;
  return `…${path.slice(-(max - 1))}`;
}

function basenameFromImagePath(imagePath: string): string {
  const norm = imagePath.replace(/\\/g, "/");
  const seg = norm.split("/").filter(Boolean).pop();
  return seg && seg.includes(".") ? seg : `playback-alert-${Date.now()}.jpg`;
}

export default function PlaybackPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sampleFps, setSampleFps] = useState(2);
  const [maxSeconds, setMaxSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trackingJobId, setTrackingJobId] = useState<string | null>(null);
  const [playbackAlerts, setPlaybackAlerts] = useState<HistoryRow[]>([]);
  const [lightbox, setLightbox] = useState<{ src: string; filename: string } | null>(null);
  const clearTokenRef = useRef(0);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const hasActive = useMemo(() => jobs.some((j) => j.status === "queued" || j.status === "running"), [jobs]);
  const trackedJob = useMemo(() => (trackingJobId ? jobs.find((j) => j.id === trackingJobId) : undefined), [jobs, trackingJobId]);

  async function refresh(): Promise<Job[]> {
    try {
      const r = await fetch(`${API_BASE}/playback/jobs`, { cache: "no-store", credentials: "include" });
      const j = await r.json();
      const next = Array.isArray(j) ? (j as Job[]) : [];
      setJobs(next);
      return next;
    } catch {
      return [];
    }
  }

  async function refreshAll() {
    const nextJobs = await refresh();
    const nextActive = nextJobs.some((j) => j.status === "queued" || j.status === "running");
    if (!nextActive) {
      clearTokenRef.current += 1;
      setPlaybackAlerts([]);
      setTrackingJobId(null);
    }
  }

  useEffect(() => {
    refresh();
    const t = window.setInterval(() => {
      refresh();
    }, hasActive ? 1500 : 5000);
    return () => window.clearInterval(t);
  }, [hasActive]);

  useEffect(() => {
    if (!trackingJobId) return;
    let cancelled = false;
    const myClearToken = clearTokenRef.current;
    async function poll() {
      try {
        const rows = await fetchHistory();
        if (cancelled) return;
        if (myClearToken !== clearTokenRef.current) return;
        const token = `playback_${trackingJobId}_`;
        setPlaybackAlerts(rows.filter((row) => row.image_path.includes(token)));
      } catch {
        /* ignore */
      }
    }
    poll();
    const interval = window.setInterval(poll, hasActive ? 1500 : 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [trackingJobId, hasActive]);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  async function downloadLightboxImage() {
    if (!lightbox) return;
    try {
      const r = await fetch(lightbox.src, { credentials: "include" });
      if (!r.ok) throw new Error("fetch failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = lightbox.filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(lightbox.src, "_blank", "noopener,noreferrer");
    }
  }

  async function upload() {
    if (!file) {
      setMsg("Choose a video file first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sampleFps", String(sampleFps));
      fd.append("maxSeconds", String(maxSeconds));
      const r = await fetch(`${API_BASE}/playback/upload`, { method: "POST", body: fd, credentials: "include" });
      const j = await r.json();
      if (!r.ok) setMsg(j?.detail ?? "Upload failed.");
      else {
        setMsg(`Uploaded. Job: ${j.jobId}`);
        setTrackingJobId(j.jobId);
        setPlaybackAlerts([]);
        setFile(null);
        refresh();
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/[0.08]";

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Playback testing</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a recorded video to test detection on CPU without live RTSP lag. Alerts will appear in History.
        </p>
      </header>
      {msg && (
        <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground">{msg}</p>
      )}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-foreground">Upload video</h2>
        <input
          type="file"
          accept="video/*"
          aria-label="Upload video file"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-sm file:text-foreground file:ring-1 file:ring-white/10 hover:file:bg-white/[0.12]"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted">Sample FPS (CPU load)</span>
            <input
              type="number"
              min={0.2}
              step={0.2}
              value={sampleFps}
              onChange={(e) => setSampleFps(Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">Max seconds (0 = full video)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={maxSeconds}
              onChange={(e) => setMaxSeconds(Number(e.target.value))}
              className={inputCls}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110 hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] disabled:opacity-50 disabled:shadow-none"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Upload & analyze
        </button>
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Jobs</h2>
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.15] px-3 py-1.5 text-xs text-foreground transition hover:bg-white/[0.06] hover:border-white/25"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center text-sm text-muted">
            No jobs yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j) => {
              const statusIcon =
                j.status === "completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : j.status === "failed" ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : j.status === "running" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                );
              const statusColor =
                j.status === "completed"
                  ? "rgba(0,255,190,0.12)"
                  : j.status === "failed"
                    ? "rgba(255,77,0,0.12)"
                    : j.status === "running"
                      ? "rgba(255,107,0,0.12)"
                      : "rgba(110,120,145,0.15)";
              const statusText =
                j.status === "completed"
                  ? "rgb(0,255,190)"
                  : j.status === "failed"
                    ? "rgb(255,77,0)"
                    : j.status === "running"
                      ? "rgb(255,107,0)"
                      : "rgb(110,120,145)";
              const wp = j.weightsPath ?? "";
              return (
                <li key={j.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: statusColor,
                            color: statusText,
                            border: `1px solid ${statusText}40`,
                          }}
                        >
                          {statusIcon}
                          {j.status}
                        </span>
                        <span className="font-mono text-[10px] text-muted">{j.id.slice(0, 12)}…</span>
                        <span className="rounded-md border border-white/[0.1] bg-black/30 px-2 py-0.5 text-[10px] text-muted">
                          Model: {formatModelLabel(j.modelFamily)}
                        </span>
                      </div>
                      {wp ? (
                        <p className="mt-1 font-mono text-[10px] text-muted/90" title={wp}>
                          {shortPath(wp)}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-sm text-foreground">{j.message}</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <div className="font-medium text-foreground">{Math.round((j.progress ?? 0) * 100)}%</div>
                      <div>
                        {j.alertsCreated} alert{j.alertsCreated !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[rgb(var(--accent-orange))]"
                      style={{ width: `${Math.round((j.progress ?? 0) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {trackingJobId && (
        <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Playback alerts (temporary)</h2>
              {trackedJob && (trackedJob.modelFamily || trackedJob.weightsPath) ? (
                <p className="mt-1 text-xs text-muted">
                  Using <span className="font-medium text-foreground">{formatModelLabel(trackedJob.modelFamily)}</span>
                  {trackedJob.weightsPath ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-mono" title={trackedJob.weightsPath ?? ""}>
                        {shortPath(trackedJob.weightsPath ?? "", 64)}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : trackedJob?.status === "queued" ? (
                <p className="mt-1 text-xs text-muted">Model will be shown when the job starts…</p>
              ) : null}
            </div>
            <span className="font-mono text-xs text-muted">{trackingJobId.slice(0, 8)}…</span>
          </div>
          {playbackAlerts.length === 0 ? (
            <p className="text-sm text-muted">No alerts yet. Running playback analysis…</p>
          ) : (
            <ul className="space-y-3">
              {playbackAlerts.map((a) => {
                const src = alertImageUrl(a.image_path);
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3 sm:flex-row sm:items-start"
                  >
                    <button
                      type="button"
                      className="group relative shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 p-0 text-left outline-none ring-offset-2 ring-offset-[rgb(10,12,16)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-orange))]"
                      onClick={() => setLightbox({ src, filename: basenameFromImagePath(a.image_path) })}
                      aria-label="Expand alert image"
                    >
                      <img
                        src={src}
                        alt=""
                        className="h-24 w-auto max-w-full object-cover transition group-hover:opacity-90"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-muted">
                        Tap to expand
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.message}</p>
                      <p className="mt-1 font-mono text-xs text-muted">{a.timestamp}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Alert image preview"
        >
          <div className="absolute right-4 top-4 z-20 flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/20 bg-black/50 p-2 text-foreground transition hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                void downloadLightboxImage();
              }}
              aria-label="Download image"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              className="rounded-xl border border-white/20 bg-black/50 p-2 text-foreground transition hover:bg-white/10"
              onClick={() => setLightbox(null)}
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-out"
            aria-label="Close preview"
            onClick={() => setLightbox(null)}
          />
          <div className="relative z-10 max-h-[100dvh] max-w-full">
            <img src={lightbox.src} alt="" className="max-h-[100dvh] max-w-[100vw] object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
