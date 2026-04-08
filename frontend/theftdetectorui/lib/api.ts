import { API_BASE } from "@/lib/config";
import type { FaceRow, HistoryRow, Settings } from "@/lib/types";

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", credentials: "include" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchStats(): Promise<{ weekly_data: number[] }> {
  return apiFetch<{ weekly_data: number[] }>("/stats", { weekly_data: [0, 0, 0, 0, 0, 0, 0] });
}

export async function fetchFaces(): Promise<FaceRow[]> {
  return apiFetch<FaceRow[]>("/faces", []);
}

export async function fetchHistory(): Promise<HistoryRow[]> {
  return apiFetch<HistoryRow[]>("/history", []);
}

export async function fetchSettings(): Promise<Settings> {
  return apiFetch<Settings>("/settings", {
    emailEnabled: false,
    smtpServer: "",
    smtpPort: "",
    senderEmail: "",
    senderPassword: "",
    receiverEmail: "",
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    roiPoints: [],
    showHeatmap: true,
    cameraSources: [],
  });
}
