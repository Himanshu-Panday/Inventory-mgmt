from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from auditlog.models import LogEntry
from auditlog.context import set_actor

from .models import (
    Item_Model,
    Size_Model,
    Vendor_Model,
    WaxReceive,
    WaxReceiveLine,
    IssueMaster,
)
from .permissions import MasterAccessPermission
from .serializers import (
    AuditLogSerializer,
    ItemModelSerializer,
    SizeModelSerializer,
    VendorModelSerializer,
    WaxReceiveSerializer,
    WaxReceiveLineSerializer,
    IssueMasterSerializer,
)


class SizeModelViewSet(viewsets.ModelViewSet):
    queryset = Size_Model.objects.all()
    serializer_class = SizeModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        logs = LogEntry.objects.get_for_object(self.get_object()).select_related("actor")
        payload = [
            {
                "id": log.id,
                "action": log.get_action_display(),
                "timestamp": log.timestamp,
                "actor_name": (
                    log.actor.get_full_name().strip()
                    if getattr(log.actor, "get_full_name", None)
                    else None
                )
                or None,
                "actor_email": getattr(log.actor, "email", None),
            }
            for log in logs
        ]
        return Response(AuditLogSerializer(payload, many=True).data)


class ItemModelViewSet(viewsets.ModelViewSet):
    queryset = Item_Model.objects.all()
    serializer_class = ItemModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        logs = LogEntry.objects.get_for_object(self.get_object()).select_related("actor")
        payload = [
            {
                "id": log.id,
                "action": log.get_action_display(),
                "timestamp": log.timestamp,
                "actor_name": (
                    log.actor.get_full_name().strip()
                    if getattr(log.actor, "get_full_name", None)
                    else None
                )
                or None,
                "actor_email": getattr(log.actor, "email", None),
            }
            for log in logs
        ]
        return Response(AuditLogSerializer(payload, many=True).data)


class VendorModelViewSet(viewsets.ModelViewSet):
    queryset = Vendor_Model.objects.select_related("item_name", "created_by").all()
    serializer_class = VendorModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        logs = LogEntry.objects.get_for_object(self.get_object()).select_related("actor")
        payload = [
            {
                "id": log.id,
                "action": log.get_action_display(),
                "timestamp": log.timestamp,
                "actor_name": (
                    log.actor.get_full_name().strip()
                    if getattr(log.actor, "get_full_name", None)
                    else None
                )
                or None,
                "actor_email": getattr(log.actor, "email", None),
            }
            for log in logs
        ]
        return Response(AuditLogSerializer(payload, many=True).data)


class WaxReceiveViewSet(viewsets.ModelViewSet):
    queryset = WaxReceive.objects.select_related("vendor", "created_by").all()
    serializer_class = WaxReceiveSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get", "post"])
    def lines(self, request, pk=None):
        wax_receive = self.get_object()

        if request.method == "GET":
            lines = wax_receive.lines.select_related("item", "size").all()
            serializer = WaxReceiveLineSerializer(lines, many=True)
            return Response(serializer.data)

        serializer = WaxReceiveLineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data["item"]
        size = serializer.validated_data["size"]
        in_weight = serializer.validated_data["in_weight"]
        in_quantity = serializer.validated_data["in_quantity"]

        vendor_rate = Vendor_Model.objects.filter(
            vendor_name=wax_receive.vendor.vendor_name, item_name=item
        ).first()
        if not vendor_rate:
            return Response(
                {"detail": "No vendor rate found for selected vendor and item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with set_actor(self.request.user):
            line = WaxReceiveLine.objects.create(
                wax_receive=wax_receive,
                item=item,
                size=size,
                in_weight=in_weight,
                in_quantity=in_quantity,
                rate=vendor_rate.rate,
            )

        return Response(WaxReceiveLineSerializer(line).data, status=status.HTTP_201_CREATED)


class IssueMasterViewSet(viewsets.ModelViewSet):
    queryset = IssueMaster.objects.select_related("item", "size", "created_by").all()
    serializer_class = IssueMasterSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)
