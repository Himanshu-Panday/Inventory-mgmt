from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import MasterName, MasterPermission, User, UserRole


class MasterPermissionSerializer(serializers.ModelSerializer):
    master_label = serializers.CharField(source="get_master_name_display", read_only=True)

    class Meta:
        model = MasterPermission
        fields = ["id", "master_name", "master_label", "can_read", "can_write", "updated_at"]
        read_only_fields = ["id", "master_label", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    master_permissions = MasterPermissionSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "date_joined",
            "updated_at",
            "master_permissions",
        ]
        read_only_fields = ["id", "date_joined", "updated_at", "master_permissions"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "role"]

    def validate_role(self, value):
        if value not in [UserRole.ADMIN, UserRole.USER]:
            raise serializers.ValidationError("Invalid role selected.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.get("role", UserRole.USER)
        user = User.objects.create_user(password=password, **validated_data)
        if role == UserRole.ADMIN:
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        return user


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    master_permissions = MasterPermissionSerializer(many=True, required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "master_permissions",
        ]

    def validate_role(self, value):
        if value != UserRole.USER:
            raise serializers.ValidationError("Admin can create only normal users from this API.")
        return value

    def create(self, validated_data):
        permissions_data = validated_data.pop("master_permissions", [])
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)

        for permission_data in permissions_data:
            MasterPermission.objects.update_or_create(
                user=user,
                master_name=permission_data["master_name"],
                defaults={
                    "can_read": permission_data["can_read"],
                    "can_write": permission_data["can_write"],
                },
            )
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    master_permissions = MasterPermissionSerializer(many=True, required=False)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "is_active",
            "master_permissions",
        ]

    def update(self, instance, validated_data):
        permissions_data = validated_data.pop("master_permissions", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if permissions_data is not None:
            MasterPermission.objects.filter(user=instance).delete()
            for permission_data in permissions_data:
                MasterPermission.objects.create(
                    user=instance,
                    master_name=permission_data["master_name"],
                    can_read=permission_data["can_read"],
                    can_write=permission_data["can_write"],
                )
        return instance


class MasterNameSerializer(serializers.Serializer):
    master_name = serializers.ChoiceField(choices=MasterName.choices)
    label = serializers.CharField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(request=self.context.get("request"), email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        attrs["user"] = user
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
