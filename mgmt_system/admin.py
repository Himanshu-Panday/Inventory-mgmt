from django.contrib import admin

from .models import (
    Item_Model,
    ItemModelHistory,
    Size_Model,
    SizeModelHistory,
    Vendor_Model,
    VendorModelHistory,
)


@admin.register(Size_Model)
class SizeModelAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "date", "created_by", "created_at"]
    search_fields = ["name"]
    list_filter = ["date", "created_at"]


@admin.register(Item_Model)
class ItemModelAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "date", "created_by", "created_at"]
    search_fields = ["name"]
    list_filter = ["date", "created_at"]


@admin.register(Vendor_Model)
class VendorModelAdmin(admin.ModelAdmin):
    list_display = ["id", "vendor_name", "item_name", "rate", "date_time", "created_by"]
    search_fields = ["vendor_name", "item_name__name"]
    list_filter = ["date_time"]


@admin.register(SizeModelHistory)
class SizeModelHistoryAdmin(admin.ModelAdmin):
    list_display = ["id", "record_id", "name", "action", "modified_by", "modified_at"]
    list_filter = ["action", "modified_at"]


@admin.register(ItemModelHistory)
class ItemModelHistoryAdmin(admin.ModelAdmin):
    list_display = ["id", "record_id", "name", "action", "modified_by", "modified_at"]
    list_filter = ["action", "modified_at"]


@admin.register(VendorModelHistory)
class VendorModelHistoryAdmin(admin.ModelAdmin):
    list_display = ["id", "record_id", "vendor_name", "action", "modified_by", "modified_at"]
    list_filter = ["action", "modified_at"]
