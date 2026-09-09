from rest_framework import viewsets
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsOwner

from .models import User
from .serializers import TeamMemberSerializer, UserSerializer


class MeView(RetrieveUpdateAPIView):
    """The logged-in user's own profile and capacity settings."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class TeamMemberViewSet(viewsets.ModelViewSet):
    """Owner-only: create/manage the accounts on their team (module: USER
    ROLES — Phase 2 multi-user support)."""

    serializer_class = TeamMemberSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        return User.objects.filter(managed_by=self.request.user).order_by("username")
