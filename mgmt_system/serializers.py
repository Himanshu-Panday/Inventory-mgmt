from rest_framework import serializers

from .models import (
    Item_Model,
    ItemModelHistory,
    Size_Model,
    SizeModelHistory,
    Vendor_Model,
    VendorModelHistory,
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


class SizeModelHistorySerializer(serializers.ModelSerializer):
    modified_by_email = serializers.EmailField(source="modified_by.email", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = SizeModelHistory
        fields = [
            "id",
            "record_id",
            "name",
            "date",
            "created_by_email",
            "modified_by_email",
            "modified_at",
            "action",
        ]


class ItemModelHistorySerializer(serializers.ModelSerializer):
    modified_by_email = serializers.EmailField(source="modified_by.email", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = ItemModelHistory
        fields = [
            "id",
            "record_id",
            "name",
            "date",
            "created_by_email",
            "modified_by_email",
            "modified_at",
            "action",
        ]


class VendorModelHistorySerializer(serializers.ModelSerializer):
    modified_by_email = serializers.EmailField(source="modified_by.email", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = VendorModelHistory
        fields = [
            "id",
            "record_id",
            "vendor_name",
            "item_name_label",
            "rate",
            "date_time",
            "created_by_email",
            "modified_by_email",
            "modified_at",
            "action",
        ]
