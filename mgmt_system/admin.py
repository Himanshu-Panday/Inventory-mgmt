from django.contrib import admin

from .models import (
    Item_Model,
    Size_Model,
    Vendor_Model,
    WaxReceive,
    WaxReceiveLine,
    IssueMaster,
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
