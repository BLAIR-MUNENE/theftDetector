from django.http import HttpResponse


class DevCorsMiddleware:
    """
    Lightweight CORS support for local parallel development.
    Keeps setup dependency-free while frontend runs on a separate port.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin", "")
        is_local_frontend = origin.startswith("http://localhost:3000") or origin.startswith("http://127.0.0.1:3000")

        # Handle CORS preflight before Django view/CSRF processing.
        if request.method == "OPTIONS" and is_local_frontend:
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if is_local_frontend:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Vary"] = "Origin"
        return response
