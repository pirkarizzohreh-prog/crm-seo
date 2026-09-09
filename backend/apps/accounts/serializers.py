from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_owner = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_owner",
            "monthly_capacity_hours",
            "working_days_per_month",
        )
        read_only_fields = ("id", "username", "role", "is_owner")


class TeamMemberSerializer(serializers.ModelSerializer):
    """Used by the Owner to create/manage staff accounts (module: USER
    ROLES in the PRD — SEO Specialist, Content Writer, Developer,
    Designer, Client Portal User)."""

    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "role",
            "monthly_capacity_hours",
            "working_days_per_month",
            "is_active",
        )
        read_only_fields = ("id",)

    def validate_role(self, value):
        if value == User.Role.OWNER:
            raise serializers.ValidationError("Team members can't be given the Owner role.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Required when creating a team member."})
        user = User(**validated_data, managed_by=self.context["request"].user)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
