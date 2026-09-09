from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """Only the Owner role may create/edit/delete; staff accounts (any
    other role) get read-only access. Used on Client/Project/TaskTemplate
    — the business-defining and financial records — while day-to-day work
    (Task, TimeEntry, Keyword) stays fully editable by the whole team."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_owner)


class IsOwner(BasePermission):
    """Owner-only, no read access for staff either (team/user management)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_owner)
