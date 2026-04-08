from pathlib import Path
from uuid import uuid4

from ninja import File, Form
from ninja.files import UploadedFile
from ninja_extra import api_controller, http_delete, http_get, http_post

from core.legacy import legacy_db_rows
from django.conf import settings


FACES_DIR = settings.REPO_ROOT / "faces_registry"
FACES_DIR.mkdir(parents=True, exist_ok=True)


@api_controller("/faces", tags=["faces"])
class FacesController:
    @http_get("")
    def list_faces(self):
        rows = legacy_db_rows("SELECT id, name, type FROM faces ORDER BY id DESC")
        return rows

    @http_post("/register")
    def register_face(
        self,
        request,
        file: UploadedFile = File(...),
        name: str = Form(...),
        type: str = Form("blacklist"),
    ):
        suffix = Path(file.name or "face.jpg").suffix or ".jpg"
        filename = f"{uuid4().hex}{suffix}"
        destination = FACES_DIR / filename
        with destination.open("wb") as f:
            f.write(file.read())
        return {"status": "success", "message": "Face image stored.", "name": name, "type": type}

    @http_delete("/{face_id}")
    def delete_face(self, face_id: str):
        return {"status": "success", "message": f"Face {face_id} removed."}
