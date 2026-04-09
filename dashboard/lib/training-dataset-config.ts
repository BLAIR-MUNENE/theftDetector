import type { TrainingDataset } from "./types";

const VALID_TASKS = new Set(["detect", "classify", "segment", "pose"]);

export type SuggestedTrainingDefaults = {
  baseModel: string;
  taskType: string;
  warnings: string[];
  rationale: string[];
};

/**
 * Phase 1: suggest training fields from persisted dataset metadata and naming heuristics.
 * Does not inspect files on disk — use backend profile later for stronger inference.
 */
export function inferSuggestedTrainingDefaults(
  dataset: TrainingDataset | null
): SuggestedTrainingDefaults | null {
  if (!dataset || dataset.status !== "ready") {
    return null;
  }

  const warnings: string[] = [];
  const rationale: string[] = [];

  if (dataset.detectedFormat && dataset.detectedFormat !== "yolo") {
    warnings.push(
      `Format is "${dataset.detectedFormat}" — this trainer expects a YOLO-style dataset. Verify labels before training.`
    );
  }

  const haystack = `${dataset.name} ${dataset.notes ?? ""}`.toLowerCase();
  const prefersYolo26 =
    /\byolov?26\b/.test(haystack) ||
    /\byolo26\b/.test(haystack) ||
    /\bv26\b/.test(haystack) ||
    haystack.includes("yolo26");

  const baseModel = prefersYolo26 ? "yolo26n.pt" : "yolov8n.pt";
  if (prefersYolo26) {
    rationale.push("Model family inferred from dataset name or notes (YOLOv26 naming heuristic).");
  } else {
    rationale.push("Default entry weights: YOLOv8n.");
  }

  let taskType = "detect";
  const rawTask = (dataset.taskType ?? "").toLowerCase().trim();
  if (rawTask && VALID_TASKS.has(rawTask)) {
    taskType = rawTask;
    rationale.push(`Task type taken from dataset registration (${rawTask}).`);
  } else if (dataset.taskType) {
    rationale.push(
      `Registered task "${dataset.taskType}" is not recognized; using object detection.`
    );
  }

  return { baseModel, taskType, warnings, rationale };
}

/** Optional batch tweak when training on CPU with large YOLO datasets. */
export function suggestBatchForCpuLargeDataset(
  sampleCount: number,
  device: string
): number | null {
  if (device !== "cpu") return null;
  if (sampleCount >= 2000) return 4;
  if (sampleCount >= 800) return 6;
  return null;
}
