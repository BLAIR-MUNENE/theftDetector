"use client";

import { useMemo, useState } from "react";
import { API_BASE } from "@/lib/config";
import type { TrainingDataset } from "@/lib/types";
import { Loader2, Play } from "lucide-react";

type Props = {
  datasets: TrainingDataset[];
  selectedDatasetId: string | null;
  onRefresh: () => Promise<void>;
  onMessage: (msg: string) => void;
};

export default function TrainForm({
  datasets,
  selectedDatasetId,
  onRefresh,
  onMessage,
}: Props) {
  const [baseModel, setBaseModel] = useState("yolov8n.pt");
  const [taskType, setTaskType] = useState("detect");
  const [epochs, setEpochs] = useState(30);
  const [imgsz, setImgsz] = useState(640);
  const [batch, setBatch] = useState(8);
  const [device, setDevice] = useState("cpu");
  const [validationSplit, setValidationSplit] = useState(0.2);
  const [patience, setPatience] = useState(10);
  const [busy, setBusy] = useState(false);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId]
  );

  async function startTraining() {
    if (!selectedDataset) {
      onMessage("Select a validated dataset first.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/training/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          baseModel,
          taskType,
          epochs,
          imgsz,
          batch,
          device,
          validationSplit,
          patience,
        }),
      });
      const j = await r.json();
      onMessage(j?.message ?? (r.ok ? "Training job created." : "Failed to start training."));
      if (r.ok) await onRefresh();
    } catch {
      onMessage("Network error while starting training.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-fidelity border border-border bg-surface/70 p-4">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Training configuration
        </h2>
        <p className="mt-1 text-sm text-muted">
          Launch one local background job at a time. Additional runs stay queued.
        </p>
      </div>

      <div className="rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground">
        Selected dataset:{" "}
        <span className="font-medium">
          {selectedDataset?.name ?? "None selected"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs text-muted">Base model</span>
          <input
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={baseModel}
            onChange={(e) => setBaseModel(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Task type</span>
          <select
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
          >
            <option value="detect">Object detection</option>
            <option value="classify">Classification</option>
            <option value="segment">Segmentation</option>
            <option value="pose">Pose</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Epochs</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Image size</span>
          <input
            type="number"
            min={64}
            step={32}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={imgsz}
            onChange={(e) => setImgsz(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Batch size</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={batch}
            onChange={(e) => setBatch(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Device</span>
          <select
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
            <option value="cpu">CPU</option>
            <option value="cuda">CUDA / GPU</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Validation split</span>
          <input
            type="number"
            min={0.05}
            max={0.5}
            step={0.05}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={validationSplit}
            onChange={(e) => setValidationSplit(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Patience</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={patience}
            onChange={(e) => setPatience(Number(e.target.value))}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={startTraining}
        disabled={busy || !selectedDataset}
        className="inline-flex items-center gap-2 rounded-fidelity bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Start training
      </button>
    </section>
  );
}
