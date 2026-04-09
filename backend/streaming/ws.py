from __future__ import annotations

import asyncio
import json
from datetime import datetime

from cameras.runtime import camera_runtime


async def websocket_heartbeat_app(scope, receive, send):
    """
    Minimal ASGI websocket endpoint compatible with current UI payload shape.
    Sends empty camera frames heartbeat while Django APIs are migrated.
    """
    if scope["type"] != "websocket":
        return

    await send({"type": "websocket.accept"})
    camera_runtime.ensure_loaded()
    try:
        while True:
            try:
                event = await asyncio.wait_for(receive(), timeout=0.01)
                if event["type"] == "websocket.disconnect":
                    break
            except asyncio.TimeoutError:
                pass
            frames = camera_runtime.get_ws_frames()
            payload = {
                "type": "multi_frame",
                "cameras": frames,
                "alert": {
                    "id": f"heartbeat-{int(datetime.utcnow().timestamp())}",
                    "message": "Django recreation backend connected.",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            }
            await send({"type": "websocket.send", "text": json.dumps(payload)})
            await asyncio.sleep(1.0)
    except Exception:
        await send({"type": "websocket.close"})
