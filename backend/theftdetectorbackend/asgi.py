import os

from django.core.asgi import get_asgi_application
from streaming.ws import websocket_heartbeat_app

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "theftdetectorbackend.settings")

django_asgi = get_asgi_application()


async def application(scope, receive, send):
    if scope["type"] == "websocket" and scope.get("path") == "/ws":
        await websocket_heartbeat_app(scope, receive, send)
        return
    await django_asgi(scope, receive, send)
