from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Item_Model,
    ItemModelHistory,
    Size_Model,
    SizeModelHistory,
    Vendor_Model,
    VendorModelHistory,
)
from .permissions import MasterAccessPermission
from .serializers import (
    ItemModelHistorySerializer,
    ItemModelSerializer,
    SizeModelHistorySerializer,
    SizeModelSerializer,
    VendorModelHistorySerializer,
    VendorModelSerializer,
)


def create_size_history(instance, user, action_type):
    SizeModelHistory.objects.create(
        record_id=instance.id,
        size_model=instance,
        name=instance.name,
        date=instance.date,
        created_by=instance.created_by,
        modified_by=user,
        action=action_type,
    )


def create_item_history(instance, user, action_type):
    ItemModelHistory.objects.create(
        record_id=instance.id,
        item_model=instance,
        name=instance.name,
        date=instance.date,
        created_by=instance.created_by,
        modified_by=user,
        action=action_type,
    )


def create_vendor_history(instance, user, action_type):
    VendorModelHistory.objects.create(
        record_id=instance.id,
        vendor_model=instance,
        vendor_name=instance.vendor_name,
        item_name_label=instance.item_name.name,
        rate=instance.rate,
        date_time=instance.date_time,
        created_by=instance.created_by,
        modified_by=user,
        action=action_type,
    )


class SizeModelViewSet(viewsets.ModelViewSet):
    queryset = Size_Model.objects.all()
    serializer_class = SizeModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        create_size_history(instance, self.request.user, "create")

    def perform_update(self, serializer):
        instance = serializer.save()
        create_size_history(instance, self.request.user, "update")

    def perform_destroy(self, instance):
        create_size_history(instance, self.request.user, "delete")
        instance.delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        history_qs = SizeModelHistory.objects.filter(record_id=pk)
        serializer = SizeModelHistorySerializer(history_qs, many=True)
        return Response(serializer.data)


class ItemModelViewSet(viewsets.ModelViewSet):
    queryset = Item_Model.objects.all()
    serializer_class = ItemModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        create_item_history(instance, self.request.user, "create")

    def perform_update(self, serializer):
        instance = serializer.save()
        create_item_history(instance, self.request.user, "update")

    def perform_destroy(self, instance):
        create_item_history(instance, self.request.user, "delete")
        instance.delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        history_qs = ItemModelHistory.objects.filter(record_id=pk)
        serializer = ItemModelHistorySerializer(history_qs, many=True)
        return Response(serializer.data)


class VendorModelViewSet(viewsets.ModelViewSet):
    queryset = Vendor_Model.objects.select_related("item_name", "created_by").all()
    serializer_class = VendorModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        create_vendor_history(instance, self.request.user, "create")

    def perform_update(self, serializer):
        instance = serializer.save()
        create_vendor_history(instance, self.request.user, "update")

    def perform_destroy(self, instance):
        create_vendor_history(instance, self.request.user, "delete")
        instance.delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        history_qs = VendorModelHistory.objects.filter(record_id=pk)
        serializer = VendorModelHistorySerializer(history_qs, many=True)
        return Response(serializer.data)
