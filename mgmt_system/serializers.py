from rest_framework import serializers

from .models import (
    Item_Model,
    Size_Model,
    Vendor_Model,
    WaxReceive,
    WaxReceiveLine,
    IssueMaster,
)


class SizeModelSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Size_Model
        fields = [
            "id",
            "name",
            "date",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "date",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]


class ItemModelSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Item_Model
        fields = [
            "id",
            "name",
            "date",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "date",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]


class VendorModelSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    item_name_label = serializers.CharField(source="item_name.name", read_only=True)

    class Meta:
        model = Vendor_Model
        fields = [
            "id",
            "vendor_name",
            "item_name",
            "item_name_label",
            "rate",
            "date_time",
            "created_by",
            "created_by_email",
        ]
        read_only_fields = [
            "id",
            "date_time",
            "created_by",
            "created_by_email",
            "item_name_label",
        ]


class AuditLogSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    action = serializers.CharField()
    timestamp = serializers.DateTimeField()
    actor_name = serializers.CharField(allow_null=True)
    actor_email = serializers.CharField(allow_null=True)


class WaxReceiveLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    size_name = serializers.CharField(source="size.name", read_only=True)

    class Meta:
        model = WaxReceiveLine
        fields = [
            "id",
            "item",
            "item_name",
            "size",
            "size_name",
            "in_weight",
            "in_quantity",
            "rate",
            "amount",
        ]
        read_only_fields = ["id", "item_name", "size_name", "rate", "amount"]


class WaxReceiveSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)

    class Meta:
        model = WaxReceive
        fields = [
            "id",
            "vendor",
            "vendor_name",
            "date_time",
            "weight",
            "quantity",
            "total_amount",
            "created_by",
        ]
        read_only_fields = [
            "id",
            "vendor_name",
            "date_time",
            "weight",
            "quantity",
            "total_amount",
            "created_by",
        ]


class IssueMasterSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    size_name = serializers.CharField(source="size.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = IssueMaster
        fields = [
            "id",
            "item",
            "item_name",
            "size",
            "size_name",
            "out_weight",
            "out_quantity",
            "description",
            "date_time",
            "created_by",
            "created_by_email",
        ]
        read_only_fields = ["id", "item_name", "size_name", "date_time", "created_by", "created_by_email"]
