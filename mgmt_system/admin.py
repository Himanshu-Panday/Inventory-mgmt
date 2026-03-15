from django.contrib import admin

from .models import (
    Item_Model,
    Size_Model,
    Vendor_Model,
    VendorList_Model,
    WaxReceive,
    WaxReceiveLine,
    IssueMaster,
    StockManagement_Model,
    DeletedRecord,
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
    list_display = ["id", "vendor", "item_name", "rate", "date_time", "created_by"]
    search_fields = ["vendor__vendor_name", "item_name__name"]
    list_filter = ["date_time"]


@admin.register(VendorList_Model)
class VendorListAdmin(admin.ModelAdmin):
    list_display = ["id", "vendor_name", "created_at", "created_by"]
    search_fields = ["vendor_name"]


class WaxReceiveLineInline(admin.TabularInline):
    model = WaxReceiveLine
    extra = 0


@admin.register(WaxReceive)
class WaxReceiveAdmin(admin.ModelAdmin):
    list_display = ["id", "vendor", "date_time", "weight", "quantity", "total_amount", "created_by"]
    list_filter = ["date_time"]
    inlines = [WaxReceiveLineInline]


@admin.register(WaxReceiveLine)
class WaxReceiveLineAdmin(admin.ModelAdmin):
    list_display = ["id", "wax_receive", "item", "size", "in_weight", "in_quantity", "rate", "amount"]
    list_filter = ["wax_receive", "item", "size"]


@admin.register(IssueMaster)
class IssueMasterAdmin(admin.ModelAdmin):
    list_display = ["id", "item", "size", "out_weight", "out_quantity", "date_time", "created_by"]
    list_filter = ["date_time"]


@admin.register(StockManagement_Model)
class StockManagementAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "item",
        "size",
        "in_weight",
        "in_quantity",
        "out_weight",
        "out_quantity",
        "balance_weight",
        "balance_quantity",
        "updated_at",
    ]
    list_filter = ["item", "size"]


@admin.register(DeletedRecord)
class DeletedRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "model_name", "object_id", "deleted_at", "deleted_by"]
    list_filter = ["model_name", "deleted_at"]
    search_fields = ["object_id", "model_name"]
