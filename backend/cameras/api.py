from ninja import Schema
from django.http import JsonResponse
from ninja_extra import api_controller, http_delete, http_get, http_post

from core.legacy import load_runtime_settings, save_runtime_settings
from cameras.runtime import camera_runtime
from cameras.rtsp_utils import RtspBuildInput, build_rtsp_url


class CameraInput(Schema):
    name: str
    source: str


class CameraConfigInput(Schema):
    cameraSources: list[CameraInput]
    reloadNow: bool = True


class RtspBuildInputSchema(Schema):
    vendor: str = "generic"
    host: str
    port: int = 554
    username: str = ""
    password: str = ""
    channel: int = 1
    streamType: str = "main"
    pathOverride: str = ""
    transport: str = ""


@api_controller("/cameras", tags=["cameras"])
class CamerasController:
    def _auth_required(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
        return None

    @http_get("")
    def list_cameras(self):
        camera_runtime.ensure_loaded()
        settings_data = load_runtime_settings()
        cams = settings_data.get("cameraSources", [])
        runtime_by_source = {str(c.get("source", "")): c for c in camera_runtime.list_cameras()}
        return [
            {
                "id": f"cam-{idx}",
                "name": c.get("name", f"Camera {idx + 1}"),
                "source": c.get("source", ""),
                "status": runtime_by_source.get(str(c.get("source", "")), {}).get("status", "configured"),
                "lastError": runtime_by_source.get(str(c.get("source", "")), {}).get("lastError"),
            }
            for idx, c in enumerate(cams)
        ]

    @http_post("")
    def add_camera(self, request, payload: CameraInput):
        guard = self._auth_required(request)
        if guard:
            return guard
        probe = camera_runtime.probe_source(payload.source)
        if not probe.ok:
            return JsonResponse({"status": "error", "message": probe.message}, status=400)
        settings_data = load_runtime_settings()
        cams = list(settings_data.get("cameraSources", []))
        cams.append({"name": payload.name, "source": payload.source})
        settings_data["cameraSources"] = cams
        save_runtime_settings(settings_data)
        camera_runtime.replace_all([{"name": str(c.get("name", "Camera")), "source": str(c.get("source", ""))} for c in cams], fallback_webcam=True)
        return {"status": "success", "message": "Camera added and connected."}

    @http_post("/config")
    def configure_cameras(self, request, payload: CameraConfigInput):
        guard = self._auth_required(request)
        if guard:
            return guard
        settings_data = load_runtime_settings()
        next_sources = [{"name": c.name, "source": c.source} for c in payload.cameraSources]
        settings_data["cameraSources"] = next_sources
        save_runtime_settings(settings_data)
        if payload.reloadNow:
            camera_runtime.replace_all(next_sources, fallback_webcam=True)
        return {
            "status": "success",
            "message": "Startup camera configuration saved" + (" and reloaded." if payload.reloadNow else "."),
            "count": len(next_sources),
        }

    @http_post("/test")
    def test_camera(self, request, payload: CameraInput):
        guard = self._auth_required(request)
        if guard:
            return guard
        probe = camera_runtime.probe_source(payload.source)
        if not probe.ok:
            return JsonResponse({"status": "error", "message": probe.message}, status=400)
        return {"status": "success", "message": probe.message}

    @http_post("/rtsp/build")
    def build_rtsp(self, request, payload: RtspBuildInputSchema):
        guard = self._auth_required(request)
        if guard:
            return guard
        try:
            source = build_rtsp_url(
                RtspBuildInput(
                    vendor=payload.vendor,
                    host=payload.host,
                    port=payload.port,
                    username=payload.username,
                    password=payload.password,
                    channel=payload.channel,
                    stream_type=payload.streamType,
                    path_override=payload.pathOverride,
                    transport=payload.transport,
                )
            )
            return {"status": "success", "source": source}
        except Exception as exc:
            return JsonResponse({"status": "error", "message": str(exc)}, status=400)

    @http_post("/rtsp/test-build")
    def test_build_rtsp(self, request, payload: RtspBuildInputSchema):
        guard = self._auth_required(request)
        if guard:
            return guard
        try:
            source = build_rtsp_url(
                RtspBuildInput(
                    vendor=payload.vendor,
                    host=payload.host,
                    port=payload.port,
                    username=payload.username,
                    password=payload.password,
                    channel=payload.channel,
                    stream_type=payload.streamType,
                    path_override=payload.pathOverride,
                    transport=payload.transport,
                )
            )
        except Exception as exc:
            return JsonResponse({"status": "error", "message": str(exc)}, status=400)
        probe = camera_runtime.probe_source(source)
        if not probe.ok:
            return JsonResponse({"status": "error", "message": probe.message, "source": source}, status=400)
        return {"status": "success", "message": probe.message, "source": source}

    @http_delete("/{camera_id}")
    def delete_camera(self, request, camera_id: str):
        guard = self._auth_required(request)
        if guard:
            return guard
        settings_data = load_runtime_settings()
        cams = list(settings_data.get("cameraSources", []))
        if camera_id.startswith("cam-"):
            idx = int(camera_id.split("-")[-1])
            if 0 <= idx < len(cams):
                cams.pop(idx)
        settings_data["cameraSources"] = cams
        save_runtime_settings(settings_data)
        camera_runtime.replace_all([{"name": str(c.get("name", "Camera")), "source": str(c.get("source", ""))} for c in cams], fallback_webcam=True)
        return {"status": "success", "message": "Camera removed."}
