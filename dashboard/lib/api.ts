import { API_BASE } from "@/lib/config";
import type {
  TrainingArtifact,
  TrainingDataset,
  TrainingDeviceCapabilities,
  TrainingJob,
  TrainingLog,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface StatsResponse {
  weekly_data: number[];
}

export async function fetchStats(): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/stats", { weekly_data: [0, 0, 0, 0, 0, 0, 0] });
}

// ---------------------------------------------------------------------------
// Alert history
// ---------------------------------------------------------------------------

export interface HistoryRow {
  id: string;
  message: string;
  timestamp: string;
  image_path: string;
}

export async function fetchHistory(): Promise<HistoryRow[]> {
  return apiFetch<HistoryRow[]>("/history", []);
}

// ---------------------------------------------------------------------------
// Faces
// ---------------------------------------------------------------------------

export interface FaceRow {
  id: string;
  name: string;
  type: "blacklist" | "whitelist";
}

export async function fetchFaces(): Promise<FaceRow[]> {
  return apiFetch<FaceRow[]>("/faces", []);
}

// ---------------------------------------------------------------------------
// Training — datasets
// ---------------------------------------------------------------------------

export async function fetchTrainingDatasets(): Promise<TrainingDataset[]> {
  return apiFetch<TrainingDataset[]>("/training/datasets", []);
}

// ---------------------------------------------------------------------------
// Training — jobs
// ---------------------------------------------------------------------------

export async function fetchTrainingJobs(): Promise<TrainingJob[]> {
  return apiFetch<TrainingJob[]>("/training/jobs", []);
}

// ---------------------------------------------------------------------------
// Training — logs
// ---------------------------------------------------------------------------

export async function fetchTrainingLogs(jobId: string): Promise<TrainingLog[]> {
  return apiFetch<TrainingLog[]>(`/training/jobs/${jobId}/logs`, []);
}

// ---------------------------------------------------------------------------
// Training — artifacts
// ---------------------------------------------------------------------------

export async function fetchTrainingArtifacts(): Promise<TrainingArtifact[]> {
  return apiFetch<TrainingArtifact[]>("/training/artifacts", []);
}

// ---------------------------------------------------------------------------
// Training — devices
// ---------------------------------------------------------------------------

const defaultDeviceCapabilities: TrainingDeviceCapabilities = {
  defaultDevice: "cpu",
  devices: [{ id: "cpu", label: "CPU", available: true }],
  cudaHealthy: false,
  diagnostic: null,
};

export async function fetchTrainingDevices(): Promise<TrainingDeviceCapabilities> {
  return apiFetch<TrainingDeviceCapabilities>("/training/devices", defaultDeviceCapabilities);
}
