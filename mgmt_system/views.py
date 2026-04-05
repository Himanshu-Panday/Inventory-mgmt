from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from auditlog.models import LogEntry
from auditlog.context import set_actor
from decimal import Decimal
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError

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
from .permissions import MasterAccessPermission
from .serializers import (
    AuditLogSerializer,
    ItemModelSerializer,
    SizeModelSerializer,
    VendorModelSerializer,
    VendorListSerializer,
    WaxReceiveSerializer,
    WaxReceiveLineSerializer,
    IssueMasterSerializer,
    StockManagementSerializer,
)


class SizeModelViewSet(viewsets.ModelViewSet):
    queryset = Size_Model.objects.all()
    serializer_class = SizeModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            return queryset.filter(is_active=False)
        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            try:
                instance.is_active = False
                instance.save(update_fields=["is_active"])
            except ProtectedError:
                raise ValidationError("This record is linked to other records and cannot be deleted.")
            except IntegrityError:
                raise ValidationError("Unable to delete record due to database constraints.")

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

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            return queryset.filter(is_active=False)
        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            try:
                instance.is_active = False
                instance.save(update_fields=["is_active"])
            except ProtectedError:
                raise ValidationError("This record is linked to other records and cannot be deleted.")
            except IntegrityError:
                raise ValidationError("Unable to delete record due to database constraints.")

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
    queryset = Vendor_Model.objects.select_related("item_name", "created_by", "vendor").all()
    serializer_class = VendorModelSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            vendor_id = self.request.query_params.get("vendor")
            if vendor_id:
                queryset = queryset.filter(vendor_id=vendor_id)
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            queryset = queryset.filter(is_active=False)
        else:
            queryset = queryset.filter(is_active=True)
        vendor_id = self.request.query_params.get("vendor")
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        return queryset

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            try:
                instance.is_active = False
                instance.save(update_fields=["is_active"])
            except ProtectedError:
                raise ValidationError("This record is linked to other records and cannot be deleted.")
            except IntegrityError:
                raise ValidationError("Unable to delete record due to database constraints.")

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


class VendorListViewSet(viewsets.ModelViewSet):
    queryset = VendorList_Model.objects.select_related("created_by").all()
    serializer_class = VendorListSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            return queryset.filter(is_active=False)
        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            try:
                instance.is_active = False
                instance.save(update_fields=["is_active"])
            except ProtectedError:
                raise ValidationError("This record is linked to other records and cannot be deleted.")
            except IntegrityError:
                raise ValidationError("Unable to delete record due to database constraints.")

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

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            return queryset.filter(is_active=False)
        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            if instance.lines.filter(is_active=True).exists():
                raise ValidationError("Delete all wax receive lines before deleting this record.")
            instance.is_active = False
            instance.save(update_fields=["is_active"])

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

    @action(detail=True, methods=["get", "post"])
    def lines(self, request, pk=None):
        wax_receive = self.get_object()

        if request.method == "GET":
            lines = wax_receive.lines.select_related("item", "size").filter(is_active=True)
            serializer = WaxReceiveLineSerializer(lines, many=True, context={"request": request})
            return Response(serializer.data)

        serializer = WaxReceiveLineSerializer(
            data={**request.data, "wax_receive": wax_receive.id},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data["item"]
        size = serializer.validated_data.get("size")
        in_weight = serializer.validated_data["in_weight"]
        in_quantity = serializer.validated_data["in_quantity"]

        vendor_rate = Vendor_Model.objects.filter(
            vendor=wax_receive.vendor, item_name=item
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
                is_active=True,
            )

        return Response(
            WaxReceiveLineSerializer(line, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class WaxReceiveLineViewSet(viewsets.ModelViewSet):
    queryset = WaxReceiveLine.objects.select_related("wax_receive", "item", "size").all()
    serializer_class = WaxReceiveLineSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = super().get_queryset()
        wax_receive_id = self.request.query_params.get("wax_receive")
        if wax_receive_id:
            queryset = queryset.filter(wax_receive_id=wax_receive_id)
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            return queryset.filter(is_active=False)
        return queryset.filter(is_active=True, wax_receive__is_active=True)

    def _resolve_rate(self, wax_receive, item):
        vendor_rate = Vendor_Model.objects.filter(vendor=wax_receive.vendor, item_name=item).first()
        if not vendor_rate:
            raise ValidationError("No vendor rate found for selected vendor and item.")
        return vendor_rate.rate

    def perform_create(self, serializer):
        wax_receive = serializer.validated_data["wax_receive"]
        item = serializer.validated_data["item"]
        rate = self._resolve_rate(wax_receive, item)
        with set_actor(self.request.user):
            serializer.save(rate=rate, is_active=True)

    def perform_update(self, serializer):
        wax_receive = serializer.instance.wax_receive
        item = serializer.validated_data.get("item", serializer.instance.item)
        rate = self._resolve_rate(wax_receive, item)
        with set_actor(self.request.user):
            serializer.save(rate=rate)

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            try:
                instance.is_active = False
                instance.save(update_fields=["is_active"])
                instance.wax_receive.recalc_totals()
                instance.wax_receive.save(update_fields=["weight", "quantity", "total_amount"])
            except ProtectedError:
                raise ValidationError("This record is linked to other records and cannot be deleted.")
            except IntegrityError:
                raise ValidationError("Unable to delete record due to database constraints.")

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


class IssueMasterViewSet(viewsets.ModelViewSet):
    queryset = IssueMaster.objects.select_related("item", "size", "created_by").all()
    serializer_class = IssueMasterSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "admin" and self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            return queryset
        is_active = self.request.query_params.get("is_active")
        if is_active in ("0", "false", "False") and self.request.user.role == "admin":
            return queryset.filter(is_active=False)
        return queryset.filter(is_active=True)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data.get("item")
        size = serializer.validated_data.get("size")
        existing = IssueMaster.objects.filter(item=item, size=size).first()
        with set_actor(self.request.user):
            if existing:
                # Update existing record instead of creating a duplicate
                updated = serializer.update(existing, serializer.validated_data)
                return Response(self.get_serializer(updated).data, status=status.HTTP_200_OK)
            created = serializer.save(created_by=self.request.user)
        return Response(self.get_serializer(created).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            try:
                instance.is_active = False
                instance.save(update_fields=["is_active"])
            except ProtectedError:
                raise ValidationError("This record is linked to other records and cannot be deleted.")
            except IntegrityError:
                raise ValidationError("Unable to delete record due to database constraints.")

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


class StockManagementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockManagement_Model.objects.select_related("item", "size").all()
    serializer_class = StockManagementSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

    @action(detail=True, methods=["get"])
    def in_details(self, request, pk=None):
        stock = self.get_object()
        rows = (
            WaxReceiveLine.objects.filter(item=stock.item, size=stock.size, is_active=True)
            .select_related("wax_receive__vendor")
            .order_by("-id")
        )
        payload = [
            {
                "id": row.id,
                "vendor_name": row.wax_receive.vendor.vendor_name,
                "in_weight": row.in_weight,
                "in_quantity": row.in_quantity,
            }
            for row in rows
        ]
        return Response(payload)
