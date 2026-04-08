import sqlite3
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from alerts.models import Alert
from faces.models import FaceEntry
from training.models import TrainingArtifact, TrainingDataset, TrainingJob, TrainingLog


class Command(BaseCommand):
    help = "Import legacy records from theft_detection.db into Django db.sqlite3"

    def handle(self, *args, **options):
        legacy_db = Path(settings.REPO_ROOT) / "theft_detection.db"
        if not legacy_db.exists():
            self.stdout.write(self.style.WARNING(f"Legacy DB not found: {legacy_db}"))
            return

        conn = sqlite3.connect(str(legacy_db))
        conn.row_factory = sqlite3.Row
        try:
            self._import_alerts(conn)
            self._import_faces(conn)
            self._import_training_datasets(conn)
            self._import_training_jobs(conn)
            self._import_training_logs(conn)
            self._import_training_artifacts(conn)
        finally:
            conn.close()
        self.stdout.write(self.style.SUCCESS("Legacy data import complete."))

    def _import_alerts(self, conn):
        rows = conn.execute("SELECT id, message, timestamp, image_path FROM alerts").fetchall()
        for r in rows:
            Alert.objects.update_or_create(
                id=str(r["id"]),
                defaults={
                    "message": r["message"] or "",
                    "timestamp": r["timestamp"] or "",
                    "image_path": r["image_path"] or "",
                },
            )
        self.stdout.write(f"Imported alerts: {len(rows)}")

    def _import_faces(self, conn):
        try:
            rows = conn.execute("SELECT id, name, type FROM faces").fetchall()
        except sqlite3.Error:
            rows = []
        for r in rows:
            FaceEntry.objects.update_or_create(
                id=str(r["id"]),
                defaults={
                    "name": r["name"] or "",
                    "type": r["type"] or "blacklist",
                },
            )
        self.stdout.write(f"Imported faces: {len(rows)}")

    def _import_training_datasets(self, conn):
        try:
            rows = conn.execute("SELECT * FROM training_datasets").fetchall()
        except sqlite3.Error:
            rows = []
        for r in rows:
            row = dict(r)
            TrainingDataset.objects.update_or_create(
                id=str(row.get("id", "")),
                defaults={
                    "name": row.get("name", "") or "",
                    "source_type": row.get("source_type", "") or "",
                    "local_path": row.get("local_path"),
                    "archive_path": row.get("archive_path"),
                    "detected_format": row.get("detected_format"),
                    "status": row.get("status", "ready") or "ready",
                    "sample_count": int(row.get("sample_count", 0) or 0),
                    "class_count": int(row.get("class_count", 0) or 0),
                    "created_at": row.get("created_at", "") or "",
                    "notes": row.get("notes"),
                    "task_type": row.get("task_type"),
                },
            )
        self.stdout.write(f"Imported training datasets: {len(rows)}")

    def _import_training_jobs(self, conn):
        try:
            rows = conn.execute("SELECT * FROM training_jobs").fetchall()
        except sqlite3.Error:
            rows = []
        for r in rows:
            row = dict(r)
            TrainingJob.objects.update_or_create(
                id=str(row.get("id", "")),
                defaults={
                    "dataset_id": row.get("dataset_id", "") or "",
                    "dataset_name": row.get("dataset_name"),
                    "base_model": row.get("base_model", "") or "",
                    "task_type": row.get("task_type", "detect") or "detect",
                    "status": row.get("status", "queued") or "queued",
                    "progress": float(row.get("progress", 0.0) or 0.0),
                    "phase": row.get("phase", "") or "",
                    "device": row.get("device", "cpu") or "cpu",
                    "created_at": row.get("created_at", "") or "",
                    "started_at": row.get("started_at"),
                    "finished_at": row.get("finished_at"),
                    "cancel_requested": bool(row.get("cancel_requested", 0)),
                    "params": row.get("params"),
                    "metrics": row.get("metrics"),
                    "error": row.get("error"),
                },
            )
        self.stdout.write(f"Imported training jobs: {len(rows)}")

    def _import_training_logs(self, conn):
        try:
            rows = conn.execute("SELECT * FROM training_logs").fetchall()
        except sqlite3.Error:
            rows = []
        for r in rows:
            row = dict(r)
            TrainingLog.objects.update_or_create(
                id=str(row.get("id", "")),
                defaults={
                    "job_id": row.get("job_id", "") or "",
                    "ts": row.get("ts", "") or "",
                    "level": row.get("level", "INFO") or "INFO",
                    "message": row.get("message", "") or "",
                },
            )
        self.stdout.write(f"Imported training logs: {len(rows)}")

    def _import_training_artifacts(self, conn):
        try:
            rows = conn.execute("SELECT * FROM training_artifacts").fetchall()
        except sqlite3.Error:
            rows = []
        for r in rows:
            row = dict(r)
            TrainingArtifact.objects.update_or_create(
                id=str(row.get("id", "")),
                defaults={
                    "job_id": row.get("job_id", "") or "",
                    "kind": row.get("kind", "") or "",
                    "path": row.get("path", "") or "",
                    "created_at": row.get("created_at", "") or "",
                    "promoted": bool(row.get("promoted", 0)),
                    "metrics": row.get("metrics"),
                },
            )
        self.stdout.write(f"Imported training artifacts: {len(rows)}")
