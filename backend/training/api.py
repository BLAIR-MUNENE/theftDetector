from ninja import Schema
from ninja_extra import api_controller, http_get, http_post

from core.legacy import legacy_db_rows


class RegisterDatasetPathInput(Schema):
    name: str
    localPath: str


@api_controller("/training", tags=["training"])
class TrainingController:
    @http_get("/datasets")
    def list_datasets(self):
        return legacy_db_rows("SELECT * FROM training_datasets ORDER BY created_at DESC")

    @http_post("/datasets/register-path")
    def register_dataset_path(self, payload: RegisterDatasetPathInput):
        return {
            "status": "success",
            "message": "Dataset path registered (recreated backend placeholder).",
            "name": payload.name,
            "localPath": payload.localPath,
        }

    @http_post("/datasets/upload")
    def upload_dataset(self):
        return {"status": "success", "message": "Upload endpoint ready in Django recreation."}

    @http_get("/jobs")
    def list_jobs(self):
        return legacy_db_rows("SELECT * FROM training_jobs ORDER BY created_at DESC")

    @http_post("/jobs")
    def create_job(self, payload: dict):
        return {"status": "success", "message": "Training job queued.", "payload": payload}

    @http_get("/jobs/{job_id}/logs")
    def get_logs(self, job_id: str):
        return legacy_db_rows("SELECT * FROM training_logs WHERE job_id = ? ORDER BY ts ASC", (job_id,))

    @http_post("/jobs/{job_id}/cancel")
    def cancel_job(self, job_id: str):
        return {"status": "success", "message": f"Cancel requested for job {job_id}."}

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
        return legacy_db_rows("SELECT * FROM training_artifacts ORDER BY created_at DESC")

    @http_post("/artifacts/{artifact_id}/promote")
    def promote_artifact(self, artifact_id: str, payload: dict | None = None):
        return {"status": "success", "message": f"Artifact {artifact_id} promoted.", "payload": payload or {}}
