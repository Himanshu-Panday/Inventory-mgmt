from django.conf import settings
from django.db import models


class BaseMasterModel(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["created_at"]

    def __str__(self):
        return self.name


class Size_Model(BaseMasterModel):
    class Meta(BaseMasterModel.Meta):
        verbose_name = "Size Model"
        verbose_name_plural = "Size Models"


class Item_Model(BaseMasterModel):
    class Meta(BaseMasterModel.Meta):
        verbose_name = "Item Model"
        verbose_name_plural = "Item Models"


class Vendor_Model(models.Model):
    vendor_name = models.CharField(max_length=255)
    item_name = models.ForeignKey(
        Item_Model,
        on_delete=models.PROTECT,
        related_name="vendors",
    )
    rate = models.IntegerField()
    date_time = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_model_created",
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Vendor Model"
        verbose_name_plural = "Vendor Models"

    def __str__(self):
        return self.vendor_name


class SizeModelHistory(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    ]

    record_id = models.IntegerField()
    size_model = models.ForeignKey(
        Size_Model,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_entries",
    )
    name = models.CharField(max_length=255)
    date = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="size_model_history_created",
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="size_model_history_modified",
    )
    modified_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)

    class Meta:
        ordering = ["-modified_at"]


class ItemModelHistory(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    ]

    record_id = models.IntegerField()
    item_model = models.ForeignKey(
        Item_Model,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_entries",
    )
    name = models.CharField(max_length=255)
    date = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="item_model_history_created",
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="item_model_history_modified",
    )
    modified_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)

    class Meta:
        ordering = ["-modified_at"]


class VendorModelHistory(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    ]

    record_id = models.IntegerField()
    vendor_model = models.ForeignKey(
        Vendor_Model,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_entries",
    )
    vendor_name = models.CharField(max_length=255)
    item_name_label = models.CharField(max_length=255)
    rate = models.IntegerField()
    date_time = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_model_history_created",
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_model_history_modified",
    )
    modified_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)

    class Meta:
        ordering = ["-modified_at"]
