from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from ninja import Schema
from ninja_extra import api_controller, http_get, http_post


class SignupInput(Schema):
    username: str
    email: str
    password: str
    fullName: str = ""


class LoginInput(Schema):
    username: str
    password: str


@api_controller("/auth", tags=["auth"])
class AuthController:
    @http_post("/signup")
    def signup(self, request, payload: SignupInput):
        try:
            user = User.objects.create_user(
                username=payload.username.strip(),
                email=payload.email.strip(),
                password=payload.password,
                first_name=payload.fullName.strip(),
            )
        except IntegrityError:
            return {"status": "error", "message": "Username already exists."}
        login(request, user)
        return {"status": "success", "message": "Signup completed.", "user": _serialize_user(user)}

    @http_post("/login")
    def login_user(self, request, payload: LoginInput):
        user = authenticate(request, username=payload.username.strip(), password=payload.password)
        if not user:
            return {"status": "error", "message": "Invalid credentials."}
        login(request, user)
        return {"status": "success", "message": "Login successful.", "user": _serialize_user(user)}

    @http_post("/logout")
    def logout_user(self, request):
        logout(request)
        return {"status": "success", "message": "Logged out."}

    @http_get("/me")
    def me(self, request):
        if not request.user.is_authenticated:
            return {"authenticated": False, "user": None}
        return {"authenticated": True, "user": _serialize_user(request.user)}


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "fullName": user.first_name or "",
    }
