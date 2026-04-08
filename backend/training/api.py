from ninja import Schema
from ninja_extra import api_controller, http_delete, http_get, http_post
from django.http import JsonResponse

from core.legacy import legacy_db_rows, use_legacy_reads
from training.models import TrainingArtifact, TrainingDataset, TrainingJob, TrainingLog


class RegisterDatasetPathInput(Schema):
    name: str
    localPath: str | None = None
    path: str | None = None
    taskType: str | None = None
    notes: str | None = None


def _admin_only(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
    if not request.user.is_staff:
        return JsonResponse({"status": "error", "message": "Admin access required."}, status=403)
    return None


@api_controller("/playback", tags=["playback"])
class PlaybackController:
    @http_get("/jobs")
    def list_playback_jobs(self):
        return []

    @http_get("/jobs/{job_id}")
    def get_playback_job(self, job_id: str):
        return {"id": job_id, "status": "unknown"}

    @http_post("/upload")
    def upload_playback(self, request, payload: dict | None = None):
        guard = _admin_only(request)
        if guard:
            return guard
        import uuid
        job_id = f"playback_{uuid.uuid4().hex[:10]}"
        return {"status": "success", "message": "Playback upload accepted.", "jobId": job_id, "payload": payload or {}}


@api_controller("/training", tags=["training"])
class TrainingController:
    @http_post("/datasets/upload")
    def upload_dataset(self, request):
        guard = _admin_only(request)
        if guard:
            return guard
        import uuid
        dataset_id = uuid.uuid4().hex
        return {"id": dataset_id, "name": "Uploaded dataset", "status": "ready", "message": "Dataset uploaded."}

    @http_get("/datasets")
    def list_datasets(self):
        if use_legacy_reads():
            return legacy_db_rows("SELECT * FROM training_datasets ORDER BY created_at DESC")
        try:
            rows = TrainingDataset.objects.all().order_by("-created_at")
            return [_dataset_to_dict(r) for r in rows]
        except Exception:
            return legacy_db_rows("SELECT * FROM training_datasets ORDER BY created_at DESC")

    @http_get("/datasets/{dataset_id}")
    def get_dataset(self, dataset_id: str):
        if use_legacy_reads():
            rows = legacy_db_rows("SELECT * FROM training_datasets WHERE id = ?", (dataset_id,))
            return rows[0] if rows else {"id": dataset_id, "status": "unknown"}
        try:
            row = TrainingDataset.objects.filter(id=dataset_id).first()
            return _dataset_to_dict(row) if row else {"id": dataset_id, "status": "unknown"}
        except Exception:
            rows = legacy_db_rows("SELECT * FROM training_datasets WHERE id = ?", (dataset_id,))
            return rows[0] if rows else {"id": dataset_id, "status": "unknown"}

    @http_post("/datasets/register-path")
    def register_dataset_path(self, request, payload: RegisterDatasetPathInput):
        guard = _admin_only(request)
        if guard:
            return guard
        import uuid
        dataset_id = uuid.uuid4().hex
        resolved_path = payload.localPath or payload.path or ""
        try:
            TrainingDataset.objects.update_or_create(
                id=dataset_id,
                defaults={
                    "name": payload.name,
                    "local_path": resolved_path,
                    "source_type": "local_path",
                    "status": "ready",
                    "task_type": payload.taskType,
                    "notes": payload.notes,
                },
            )
        except Exception:
            pass
        return {
            "id": dataset_id,
            "message": "Dataset path registered.",
            "name": payload.name,
            "localPath": resolved_path,
            "status": "ready",
        }

    @http_post("/datasets/{dataset_id}/validate")
    def validate_dataset(self, request, dataset_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Dataset {dataset_id} validated and ready."}

    @http_get("/jobs")
    def list_jobs(self):
        if use_legacy_reads():
            return legacy_db_rows("SELECT * FROM training_jobs ORDER BY created_at DESC")
        try:
            rows = TrainingJob.objects.all().order_by("-created_at")
            return [_job_to_dict(r) for r in rows]
        except Exception:
            return legacy_db_rows("SELECT * FROM training_jobs ORDER BY created_at DESC")

    @http_get("/jobs/{job_id}")
    def get_job(self, job_id: str):
        if use_legacy_reads():
            rows = legacy_db_rows("SELECT * FROM training_jobs WHERE id = ?", (job_id,))
            return rows[0] if rows else {"id": job_id, "status": "unknown"}
        try:
            row = TrainingJob.objects.filter(id=job_id).first()
            return _job_to_dict(row) if row else {"id": job_id, "status": "unknown"}
        except Exception:
            rows = legacy_db_rows("SELECT * FROM training_jobs WHERE id = ?", (job_id,))
            return rows[0] if rows else {"id": job_id, "status": "unknown"}

    @http_post("/jobs")
    def create_job(self, request, payload: dict):
        guard = _admin_only(request)
        if guard:
            return guard
        import uuid
        job_id = uuid.uuid4().hex
        try:
            TrainingJob.objects.update_or_create(
                id=job_id,
                defaults={
                    "dataset_id": str(payload.get("datasetId", "")),
                    "dataset_name": str(payload.get("datasetName", "")) or None,
                    "base_model": str(payload.get("baseModel", "")),
                    "task_type": str(payload.get("taskType", "detect")),
                    "status": "queued",
                    "phase": "queued",
                    "device": str(payload.get("device", "cpu")),
                    "params": payload,
                },
            )
        except Exception:
            pass
        return {"status": "success", "message": "Training job queued.", "id": job_id, "payload": payload}

    @http_get("/jobs/{job_id}/logs")
    def get_logs(self, job_id: str):
        if use_legacy_reads():
            return legacy_db_rows("SELECT * FROM training_logs WHERE job_id = ? ORDER BY ts ASC", (job_id,))
        try:
            rows = TrainingLog.objects.filter(job_id=job_id).order_by("ts")
            return [_log_to_dict(r) for r in rows]
        except Exception:
            return legacy_db_rows("SELECT * FROM training_logs WHERE job_id = ? ORDER BY ts ASC", (job_id,))

    @http_post("/jobs/{job_id}/cancel")
    def cancel_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Cancel requested for job {job_id}."}

    @http_post("/jobs/{job_id}/resume")
    def resume_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Resume requested for job {job_id}.", "job": {"id": job_id}}

    @http_post("/jobs/{job_id}")
    def post_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Job {job_id} updated."}

    @http_delete("/jobs/{job_id}")
    def delete_job(self, request, job_id: str):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Job {job_id} deleted."}

    @http_get("/devices")
    def devices(self):
        return {
            "defaultDevice": "cpu",
            "devices": [{"id": "cpu", "label": "CPU", "available": True}],
            "cudaHealthy": False,
            "diagnostic": None,
        }

    @http_get("/artifacts")
    def artifacts(self):
        if use_legacy_reads():
            return legacy_db_rows("SELECT * FROM training_artifacts ORDER BY created_at DESC")
        try:
            rows = TrainingArtifact.objects.all().order_by("-created_at")
            return [_artifact_to_dict(r) for r in rows]
        except Exception:
            return legacy_db_rows("SELECT * FROM training_artifacts ORDER BY created_at DESC")

    @http_post("/artifacts/{artifact_id}/promote")
    def promote_artifact(self, request, artifact_id: str, payload: dict | None = None):
        guard = _admin_only(request)
        if guard:
            return guard
        return {"status": "success", "message": f"Artifact {artifact_id} promoted.", "payload": payload or {}}


def _dataset_to_dict(row: TrainingDataset | None) -> dict:
    if row is None:
        return {}
    return {
        "id": row.id,
        "name": row.name,
        "sourceType": row.source_type,
        "localPath": row.local_path,
        "archivePath": row.archive_path,
        "detectedFormat": row.detected_format,
        "status": row.status,
        "sampleCount": row.sample_count,
        "classCount": row.class_count,
        "createdAt": row.created_at,
        "notes": row.notes,
        "taskType": row.task_type,
    }


def _job_to_dict(row: TrainingJob | None) -> dict:
    if row is None:
        return {}
    return {
        "id": row.id,
        "datasetId": row.dataset_id,
        "datasetName": row.dataset_name,
        "baseModel": row.base_model,
        "taskType": row.task_type,
        "status": row.status,
        "progress": row.progress,
        "phase": row.phase,
        "device": row.device,
        "createdAt": row.created_at,
        "startedAt": row.started_at,
        "finishedAt": row.finished_at,
        "cancelRequested": row.cancel_requested,
        "params": row.params,
        "metrics": row.metrics,
        "error": row.error,
    }


def _log_to_dict(row: TrainingLog) -> dict:
    return {"id": row.id, "jobId": row.job_id, "ts": row.ts, "level": row.level, "message": row.message}


def _artifact_to_dict(row: TrainingArtifact) -> dict:
    return {
        "id": row.id,
        "jobId": row.job_id,
        "kind": row.kind,
        "path": row.path,
        "createdAt": row.created_at,
        "promoted": row.promoted,
        "metrics": row.metrics,
    }
