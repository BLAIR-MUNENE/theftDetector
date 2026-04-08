from django.db import models


class FaceEntry(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=32, default="blacklist")
    image_path = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "faces"
        ordering = ["-created_at"]
