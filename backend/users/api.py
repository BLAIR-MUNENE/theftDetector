from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.http import JsonResponse
from ninja import Schema
from ninja_extra import api_controller, http_get, http_patch, http_post


class SignupInput(Schema):
    username: str
    email: str
    password: str
    fullName: str = ""


class LoginInput(Schema):
    username: str
    password: str


class ProfileUpdateInput(Schema):
    fullName: str | None = None
    email: str | None = None


class ChangePasswordInput(Schema):
    currentPassword: str
    newPassword: str


class UserRoleUpdateInput(Schema):
    isAdmin: bool


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


@api_controller("/profile", tags=["profile"])
class ProfileController:
    @http_get("/me")
    def profile_me(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
        return {"status": "success", "user": _serialize_user(request.user)}

    @http_patch("/me")
    def update_profile(self, request, payload: ProfileUpdateInput):
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
        user = request.user
        if payload.fullName is not None:
            user.first_name = payload.fullName.strip()
        if payload.email is not None:
            user.email = payload.email.strip()
        user.save(update_fields=["first_name", "email"])
        return {"status": "success", "message": "Profile updated.", "user": _serialize_user(user)}

    @http_post("/change-password")
    def change_password(self, request, payload: ChangePasswordInput):
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
        user = request.user
        if not user.check_password(payload.currentPassword):
            return JsonResponse({"status": "error", "message": "Current password is incorrect."}, status=400)
        user.set_password(payload.newPassword)
        user.save(update_fields=["password"])
        login(request, user)
        return {"status": "success", "message": "Password changed successfully."}


@api_controller("/auth/admin", tags=["admin"])
class AdminUsersController:
    @http_get("/users")
    def list_users(self, request):
        guard = _require_admin(request)
        if guard:
            return guard
        users = User.objects.all().order_by("id")
        return [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "fullName": u.first_name or "",
                "isAdmin": bool(u.is_staff),
                "role": "admin" if u.is_staff else "user",
            }
            for u in users
        ]

    @http_patch("/users/{user_id}/role")
    def update_user_role(self, request, user_id: int, payload: UserRoleUpdateInput):
        guard = _require_admin(request)
        if guard:
            return guard
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found."}, status=404)
        user.is_staff = payload.isAdmin
        user.save(update_fields=["is_staff"])
        return {"status": "success", "message": "User role updated.", "user": _serialize_user(user)}


def _require_admin(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "Authentication required."}, status=401)
    if not request.user.is_staff:
        return JsonResponse({"status": "error", "message": "Admin access required."}, status=403)
    return None


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "fullName": user.first_name or "",
        "isAdmin": bool(user.is_staff),
        "role": "admin" if user.is_staff else "user",
    }
