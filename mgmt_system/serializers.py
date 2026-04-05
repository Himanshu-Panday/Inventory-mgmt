from rest_framework import serializers

from .models import (
    Item_Model,
    Size_Model,
    Vendor_Model,
    VendorList_Model,
    WaxReceive,
    WaxReceiveLine,
    IssueMaster,
    StockManagement_Model,
)


class SizeModelSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Size_Model
        fields = [
            "id",
            "name",
            "date",
            "is_active",
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
            "is_active",
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
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)

    class Meta:
        model = Vendor_Model
        fields = [
            "id",
            "vendor",
            "vendor_name",
            "item_name",
            "item_name_label",
            "rate",
            "date_time",
            "is_active",
            "created_by",
            "created_by_email",
        ]
        read_only_fields = [
            "id",
            "date_time",
            "created_by",
            "created_by_email",
            "item_name_label",
            "vendor_name",
        ]


class VendorListSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = VendorList_Model
        fields = [
            "id",
            "vendor_name",
            "created_at",
            "is_active",
            "created_by",
            "created_by_email",
        ]
        read_only_fields = ["id", "created_at", "created_by", "created_by_email"]


class AuditLogSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    action = serializers.CharField()
    timestamp = serializers.DateTimeField()
    actor_name = serializers.CharField(allow_null=True)
    actor_email = serializers.CharField(allow_null=True)


class WaxReceiveLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    size_name = serializers.SerializerMethodField()
    size = serializers.PrimaryKeyRelatedField(
        queryset=Size_Model.objects.all(),
        required=False,
        allow_null=True,
    )
    image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = WaxReceiveLine
        fields = [
            "id",
            "wax_receive",
            "item",
            "item_name",
            "size",
            "size_name",
            "in_weight",
            "in_quantity",
            "rate",
            "amount",
            "image",
            "is_active",
        ]
        read_only_fields = ["id", "item_name", "size_name", "rate", "amount"]

    def get_size_name(self, instance):
        return instance.size.name if instance.size else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if instance.image:
            if request:
                data["image"] = request.build_absolute_uri(instance.image.url)
            else:
                data["image"] = instance.image.url
        else:
            data["image"] = None
        return data
    

# class WaxReceiveSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.vendor_name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

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
            "is_active",
            "created_by",
            "created_by_email",
        ]
        read_only_fields = [
            "id",
            "vendor_name",
            "date_time",
            "weight",
            "quantity",
            "total_amount",
            "created_by",
            "created_by_email",
        ]
class WaxReceiveLineSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    size_name = serializers.SerializerMethodField()
    size = serializers.PrimaryKeyRelatedField(
        queryset=Size_Model.objects.all(),
        required=False,
        allow_null=True,
    )
    image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = WaxReceiveLine
        fields = [
            "id",
            "wax_receive",
            "item",
            "item_name",
            "size",
            "size_name",
            "in_weight",
            "in_quantity",
            "rate",
            "amount",
            "image",
            "is_active",
        ]
        read_only_fields = ["id", "item_name", "size_name", "rate", "amount"]

    def get_size_name(self, instance):
        return instance.size.name if instance.size else None

    def to_representation(self, instance):
        data = super().to_representation(instance)

        BASE_URL = "http://139.59.52.250:8080"  # ✅ fallback base URL

        request = self.context.get("request")

        if instance.image:
            if request:
                data["image"] = request.build_absolute_uri(instance.image.url)
            else:
                data["image"] = f"{BASE_URL}{instance.image.url}"
        else:
            data["image"] = None

        return data

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
            "is_active",
            "created_by",
            "created_by_email",
        ]
        read_only_fields = ["id", "item_name", "size_name", "date_time", "created_by", "created_by_email"]


class StockManagementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    size_name = serializers.SerializerMethodField()

    class Meta:
        model = StockManagement_Model
        fields = [
            "id",
            "item",
            "item_name",
            "size",
            "size_name",
            "in_weight",
            "in_quantity",
            "out_weight",
            "out_quantity",
            "balance_weight",
            "balance_quantity",
            "updated_at",
            "is_active",
        ]
        read_only_fields = fields

    def get_size_name(self, instance):
        return instance.size.name if instance.size else None
