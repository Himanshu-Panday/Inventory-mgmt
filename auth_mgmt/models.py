from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    USER = "user", "User"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")

        email = self.normalize_email(email)
        extra_fields.setdefault("role", UserRole.USER)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.role})"


class AdminUser(User):
    class Meta:
        proxy = True
        verbose_name = "Admin User"
        verbose_name_plural = "Admin Users"


class NormalUser(User):
    class Meta:
        proxy = True
        verbose_name = "Normal User"
        verbose_name_plural = "Normal Users"


class MasterName(models.TextChoices):
    VENDOR_MASTER = "vendor_master", "Vendor-Master"
    ITEM_MASTER = "item_master", "Item-Master"
    SIZE_MASTER = "size_master", "Size-Master"
    WAX_RECEIVE = "wax_receive", "Wax-Receive"
    ISSUE_MASTER = "issue_master", "Issue-Master"
    STOCK_MANAGEMENT = "stock_management", "StockManagement"
    DELETED_RECORDS = "deleted_records", "Deleted Records"


class MasterPermission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="master_permissions")
    master_name = models.CharField(max_length=50, choices=MasterName.choices)
    can_read = models.BooleanField(default=False)
    can_create_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "master_name")
        ordering = ["master_name"]

    def __str__(self):
        return (
            f"{self.user.email} - {self.master_name} "
            f"(R:{self.can_read}, CU:{self.can_create_update}, D:{self.can_delete})"
        )
