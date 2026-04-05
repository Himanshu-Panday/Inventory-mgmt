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
        if user.role == "admin" or user.is_staff or user.is_superuser:
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
