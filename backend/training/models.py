from django.db import models


class TrainingDataset(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=32, blank=True, default="")
    local_path = models.TextField(blank=True, null=True)
    archive_path = models.TextField(blank=True, null=True)
    detected_format = models.CharField(max_length=64, blank=True, null=True)
    status = models.CharField(max_length=32, default="ready")
    sample_count = models.IntegerField(default=0)
    class_count = models.IntegerField(default=0)
    created_at = models.CharField(max_length=64, blank=True, default="")
    notes = models.TextField(blank=True, null=True)
    task_type = models.CharField(max_length=32, blank=True, null=True)

    class Meta:
        db_table = "training_datasets"
        ordering = ["-created_at"]


class TrainingJob(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    dataset_id = models.CharField(max_length=128, db_index=True)
    dataset_name = models.CharField(max_length=255, blank=True, null=True)
    base_model = models.CharField(max_length=128, blank=True, default="")
    task_type = models.CharField(max_length=32, blank=True, default="detect")
    status = models.CharField(max_length=32, default="queued")
    progress = models.FloatField(default=0.0)
    phase = models.CharField(max_length=128, blank=True, default="")
    device = models.CharField(max_length=32, blank=True, default="cpu")
    created_at = models.CharField(max_length=64, blank=True, default="")
    started_at = models.CharField(max_length=64, blank=True, null=True)
    finished_at = models.CharField(max_length=64, blank=True, null=True)
    cancel_requested = models.BooleanField(default=False)
    params = models.JSONField(blank=True, null=True)
    metrics = models.JSONField(blank=True, null=True)
    error = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "training_jobs"
        ordering = ["-created_at"]


class TrainingLog(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    job_id = models.CharField(max_length=128, db_index=True)
    ts = models.CharField(max_length=64, blank=True, default="")
    level = models.CharField(max_length=32, blank=True, default="INFO")
    message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "training_logs"
        ordering = ["ts"]


class TrainingArtifact(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    job_id = models.CharField(max_length=128, db_index=True)
    kind = models.CharField(max_length=64, blank=True, default="")
    path = models.TextField(blank=True, default="")
    created_at = models.CharField(max_length=64, blank=True, default="")
    promoted = models.BooleanField(default=False)
    metrics = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = "training_artifacts"
        ordering = ["-created_at"]
