from __future__ import annotations

import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from uuid import uuid4

import cv2  # type: ignore
from django.conf import settings

from alerts.models import Alert
from core.legacy import load_runtime_settings

try:
    from ultralytics import YOLO as _YOLO  # type: ignore
except Exception:  # pragma: no cover
    _YOLO = None

YOLO = _YOLO


@dataclass
class PlaybackUploadConfig:
    sample_fps: float = 2.0
    max_seconds: float = 0.0


playback_jobs_lock = threading.Lock()
playback_jobs: dict[str, dict] = {}


def resolve_playback_model_snapshot() -> dict[str, str]:
    """Snapshot settings at job start: family label + weights path passed to YOLO()."""
    runtime = load_runtime_settings()
    family = str(runtime.get("activeDetectionModel", "yolov8")).strip().lower()
    if family == "yolov26":
        promoted = runtime.get("activeObjectWeightsYolov26")
        path = str(promoted).strip() if promoted else "yolo26n.pt"
        return {"modelFamily": "yolov26", "weightsPath": path}
    promoted = runtime.get("activeObjectWeightsYolov8")
    path = str(promoted).strip() if promoted else "yolov8n.pt"
    return {"modelFamily": "yolov8", "weightsPath": path}


def _create_alert_image_and_row(job_id: str, frame) -> None:
    alerts_dir = settings.REPO_ROOT / "alerts"
    alerts_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"playback_{job_id}_{ts}.jpg"
    out_path = alerts_dir / filename
    cv2.imwrite(str(out_path), frame)
    Alert.objects.create(
        id=uuid4().hex,
        message="PLAYBACK ALERT: detection found",
        timestamp=datetime.now().isoformat(),
        image_path=str(out_path),
    )


def run_playback_job(job_id: str, video_path: str, cfg: PlaybackUploadConfig) -> None:
    snapshot = resolve_playback_model_snapshot()
    now = datetime.now().isoformat()
    with playback_jobs_lock:
        job = playback_jobs.get(job_id)
        if not job:
            return
        job["status"] = "running"
        job["startedAt"] = now
        job["message"] = "Starting analysis..."
        job["modelFamily"] = snapshot["modelFamily"]
        job["weightsPath"] = snapshot["weightsPath"]

    try:
        if YOLO is None:
            raise RuntimeError("Ultralytics is not installed in this environment.")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError("Could not open uploaded video.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        if fps <= 0:
            fps = 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        sample_every = max(1, int(round(fps / max(cfg.sample_fps, 0.1))))
        max_frames = int(cfg.max_seconds * fps) if cfg.max_seconds and cfg.max_seconds > 0 else None

        model = YOLO(snapshot["weightsPath"])
        frame_idx = 0
        processed = 0
        alerts_created = 0
        last_alert_second = -99.0

        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            frame_idx += 1
            if max_frames and frame_idx > max_frames:
                break
            if frame_idx % sample_every != 0:
                continue

            processed += 1
            results = model(frame, verbose=False, conf=0.35)
            has_detection = False
            if results and results[0].boxes is not None and len(results[0].boxes) > 0:
                has_detection = True

            current_second = frame_idx / float(fps)
            if has_detection and (current_second - last_alert_second) >= 2.0:
                _create_alert_image_and_row(job_id, frame)
                alerts_created += 1
                last_alert_second = current_second

            with playback_jobs_lock:
                current = playback_jobs.get(job_id)
                if not current:
                    break
                current["progress"] = min(1.0, frame_idx / float(total_frames)) if total_frames > 0 else 0.0
                current["alertsCreated"] = alerts_created
                current["message"] = f"Processed {processed} sampled frames"

        cap.release()
        with playback_jobs_lock:
            current = playback_jobs.get(job_id)
            if current:
                current["status"] = "completed"
                current["finishedAt"] = datetime.now().isoformat()
                current["progress"] = 1.0
                current["alertsCreated"] = alerts_created
                current["message"] = "Completed"
    except Exception as exc:
        with playback_jobs_lock:
            current = playback_jobs.get(job_id)
            if current:
                current["status"] = "failed"
                current["finishedAt"] = datetime.now().isoformat()
                current["message"] = str(exc)


def create_playback_job(video_path: str, filename: str, cfg: PlaybackUploadConfig) -> dict:
    job_id = uuid4().hex
    job = {
        "id": job_id,
        "status": "queued",
        "progress": 0.0,
        "message": "Queued",
        "createdAt": datetime.now().isoformat(),
        "startedAt": None,
        "finishedAt": None,
        "alertsCreated": 0,
        "filename": filename,
        "path": video_path,
        "modelFamily": None,
        "weightsPath": None,
    }
    with playback_jobs_lock:
        playback_jobs[job_id] = job
    threading.Thread(target=run_playback_job, args=(job_id, video_path, cfg), daemon=True).start()
    return job
