from ninja import Schema
from ninja_extra import api_controller, http_delete, http_get, http_post

from core.legacy import load_runtime_settings, save_runtime_settings


class CameraInput(Schema):
    name: str
    source: str


class CameraConfigInput(Schema):
    cameraSources: list[CameraInput]
    reloadNow: bool = True


@api_controller("/cameras", tags=["cameras"])
class CamerasController:
    @http_get("")
    def list_cameras(self):
        settings_data = load_runtime_settings()
        cams = settings_data.get("cameraSources", [])
        return [
            {
                "id": f"cam-{idx}",
                "name": c.get("name", f"Camera {idx + 1}"),
                "source": c.get("source", ""),
                "status": "configured",
            }
            for idx, c in enumerate(cams)
        ]

    @http_post("")
    def add_camera(self, payload: CameraInput):
        settings_data = load_runtime_settings()
        cams = list(settings_data.get("cameraSources", []))
        cams.append({"name": payload.name, "source": payload.source})
        settings_data["cameraSources"] = cams
        save_runtime_settings(settings_data)
        return {"status": "success", "message": "Camera added."}

    @http_post("/config")
    def configure_cameras(self, payload: CameraConfigInput):
        settings_data = load_runtime_settings()
        settings_data["cameraSources"] = [{"name": c.name, "source": c.source} for c in payload.cameraSources]
        save_runtime_settings(settings_data)
        return {"status": "success", "message": "Startup camera configuration saved."}

    @http_post("/test")
    def test_camera(self, payload: CameraInput):
        return {"status": "success", "message": f"Camera source accepted for test: {payload.source}"}

    @http_delete("/{camera_id}")
    def delete_camera(self, camera_id: str):
        settings_data = load_runtime_settings()
        cams = list(settings_data.get("cameraSources", []))
        if camera_id.startswith("cam-"):
            idx = int(camera_id.split("-")[-1])
            if 0 <= idx < len(cams):
                cams.pop(idx)
        settings_data["cameraSources"] = cams
        save_runtime_settings(settings_data)
        return {"status": "success", "message": "Camera removed."}
