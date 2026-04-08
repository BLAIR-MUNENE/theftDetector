from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote


def _clean(v: str | None, default: str = "") -> str:
    return (v or default).strip()


def _normalize_stream_type(stream_type: str | None) -> str:
    value = _clean(stream_type, "main").lower()
    return "sub" if value == "sub" else "main"


@dataclass
class RtspBuildInput:
    vendor: str = "generic"
    host: str = ""
    port: int = 554
    username: str = ""
    password: str = ""
    channel: int = 1
    stream_type: str = "main"
    path_override: str = ""
    transport: str = ""


def build_rtsp_url(payload: RtspBuildInput) -> str:
    vendor = _clean(payload.vendor, "generic").lower()
    host = _clean(payload.host)
    if not host:
        raise ValueError("Host is required.")

    username = _clean(payload.username)
    password = _clean(payload.password)
    channel = max(1, int(payload.channel or 1))
    stream_type = _normalize_stream_type(payload.stream_type)
    path_override = _clean(payload.path_override)
    transport = _clean(payload.transport).lower()
    port = int(payload.port or 554)

    auth = ""
    if username:
        auth = quote(username, safe="")
        if password:
            auth += ":" + quote(password, safe="")
        auth += "@"

    if path_override:
        path = path_override
    elif vendor == "dahua":
        subtype = "1" if stream_type == "sub" else "0"
        path = f"/cam/realmonitor?channel={channel}&subtype={subtype}"
    elif vendor == "hikvision":
        suffix = "02" if stream_type == "sub" else "01"
        path = f"/Streaming/Channels/{channel}{suffix}"
    else:
        # Generic fallback follows common profile path convention.
        path = f"/Streaming/Channels/{channel}{'02' if stream_type == 'sub' else '01'}"

    if not path.startswith("/"):
        path = "/" + path

    if transport in {"tcp", "udp"}:
        joiner = "&" if "?" in path else "?"
        path = f"{path}{joiner}rtsp_transport={transport}"

    return f"rtsp://{auth}{host}:{port}{path}"


def mask_rtsp_for_logs(source: str) -> str:
    # Avoid leaking credentials in logs/messages.
    if "@" not in source or "://" not in source:
        return source
    scheme, rest = source.split("://", 1)
    if "@" not in rest:
        return source
    _auth, tail = rest.split("@", 1)
    return f"{scheme}://***@{tail}"

