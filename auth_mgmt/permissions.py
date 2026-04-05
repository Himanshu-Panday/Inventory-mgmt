from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = "Only admin users can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = (getattr(request.user, "role", "") or "").lower()
        return bool(role == "admin" or request.user.is_staff or request.user.is_superuser)
