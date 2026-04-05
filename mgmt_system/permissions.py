from rest_framework.permissions import SAFE_METHODS, BasePermission

MASTER_BY_BASENAME = {
    "item-model": "item_master",
    "size-model": "size_master",
    "vendor-list": "vendor_master",
    "vendor-model": "vendor_master",
    "wax-receive": "wax_receive",
    "wax-receive-line": "wax_receive",
    "issue-master": "issue_master",
    "stock-management": "stock_management",
}


class MasterAccessPermission(BasePermission):
    message = "You do not have permission to access this master."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = (getattr(user, "role", "") or "").lower()
        if role == "admin" or user.is_staff or user.is_superuser:
            return True

        is_inactive_request = request.query_params.get("is_active") in ("0", "false", "False")
        if request.method in SAFE_METHODS and is_inactive_request:
            deleted_perm = user.master_permissions.filter(master_name="deleted_records").first()
            if deleted_perm and deleted_perm.can_read:
                return True

        master_name = MASTER_BY_BASENAME.get(getattr(view, "basename", ""))
        if not master_name:
            return False

        user_permission = user.master_permissions.filter(master_name=master_name).first()
        if not user_permission:
            return False

        if request.method in SAFE_METHODS:
            return user_permission.can_read

        if request.method == "DELETE":
            return user_permission.can_delete

        # POST / PUT / PATCH
        return user_permission.can_create_update
