from rest_framework import permissions, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from auditlog.models import LogEntry
from auditlog.context import set_actor
from auth_mgmt.permissions import IsAdminRole
from decimal import Decimal

from .models import (
    DeletedRecord,
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
    DeletedRecordSerializer,
    ItemModelSerializer,
    SizeModelSerializer,
    VendorModelSerializer,
    VendorListSerializer,
    WaxReceiveSerializer,
    WaxReceiveLineSerializer,
    IssueMasterSerializer,
    StockManagementSerializer,
)
from .deleted_records import archive_deleted_record


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
            archive_deleted_record(instance, self.request.user, {"name": instance.name})

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
            archive_deleted_record(instance, self.request.user, {"name": instance.name})

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
            instance.delete()
            archive_deleted_record(
                instance,
                self.request.user,
                {
                    "vendor_name": instance.vendor.vendor_name,
                    "item_name_label": instance.item_name.name,
                },
            )

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

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()
            archive_deleted_record(instance, self.request.user, {"vendor_name": instance.vendor_name})

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

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            if instance.lines.exists():
                raise ValidationError("Delete all wax receive lines before deleting this record.")
            lines_payload = [
                {
                    "item": line.item_id,
                    "size": line.size_id,
                    "in_weight": str(line.in_weight),
                    "in_quantity": line.in_quantity,
                    "rate": str(line.rate),
                }
                for line in instance.lines.all()
            ]
            archive_deleted_record(
                instance,
                self.request.user,
                {"vendor_name": instance.vendor.vendor_name, "lines": lines_payload},
            )
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

    @action(detail=True, methods=["get", "post"])
    def lines(self, request, pk=None):
        wax_receive = self.get_object()

        if request.method == "GET":
            lines = wax_receive.lines.select_related("item", "size").all()
            serializer = WaxReceiveLineSerializer(lines, many=True, context={"request": request})
            return Response(serializer.data)

        serializer = WaxReceiveLineSerializer(
            data={**request.data, "wax_receive": wax_receive.id},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data["item"]
        size = serializer.validated_data["size"]
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
        return queryset

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
            serializer.save(rate=rate)

    def perform_update(self, serializer):
        wax_receive = serializer.instance.wax_receive
        item = serializer.validated_data.get("item", serializer.instance.item)
        rate = self._resolve_rate(wax_receive, item)
        with set_actor(self.request.user):
            serializer.save(rate=rate)

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            archive_deleted_record(
                instance,
                self.request.user,
                {
                    "item_name": instance.item.name,
                    "size_name": instance.size.name,
                    "wax_receive": instance.wax_receive_id,
                    "vendor_name": instance.wax_receive.vendor.vendor_name,
                    "wax_receive_date_time": instance.wax_receive.date_time.isoformat()
                    if instance.wax_receive.date_time
                    else None,
                },
            )
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


class IssueMasterViewSet(viewsets.ModelViewSet):
    queryset = IssueMaster.objects.select_related("item", "size", "created_by").all()
    serializer_class = IssueMasterSerializer
    permission_classes = [permissions.IsAuthenticated, MasterAccessPermission]

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
            instance.delete()
            archive_deleted_record(
                instance,
                self.request.user,
                {
                    "item_name": instance.item.name,
                    "size_name": instance.size.name,
                },
            )

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
            WaxReceiveLine.objects.filter(item=stock.item, size=stock.size)
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


class DeletedRecordViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    queryset = DeletedRecord.objects.select_related("deleted_by").all()
    serializer_class = DeletedRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        queryset = super().get_queryset()
        model_name = self.request.query_params.get("model")
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        return queryset

    @action(detail=True, methods=["post"])
    def recover(self, request, pk=None):
        record = self.get_object()
        payload = record.payload or {}

        def resolve_user(user_id):
            if not user_id:
                return None
            try:
                return request.user.__class__.objects.get(pk=user_id)
            except request.user.__class__.DoesNotExist:
                return None

        created_by = resolve_user(payload.get("created_by"))

        try:
            if record.model_name == "item_model":
                obj = Item_Model.objects.create(name=payload.get("name", ""), created_by=created_by)
            elif record.model_name == "size_model":
                obj = Size_Model.objects.create(name=payload.get("name", ""), created_by=created_by)
            elif record.model_name == "vendor_list":
                obj = VendorList_Model.objects.create(
                    vendor_name=payload.get("vendor_name", ""), created_by=created_by
                )
            elif record.model_name == "vendor_model":
                vendor_id = payload.get("vendor")
                item_id = payload.get("item_name")
                if not vendor_id or not item_id:
                    return Response(
                        {"detail": "Missing vendor or item for recovery."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                vendor = VendorList_Model.objects.filter(pk=vendor_id).first()
                item = Item_Model.objects.filter(pk=item_id).first()
                if not vendor and payload.get("vendor_name"):
                    vendor = VendorList_Model.objects.filter(
                        vendor_name=payload.get("vendor_name")
                    ).first()
                    if not vendor:
                        vendor = VendorList_Model.objects.create(
                            vendor_name=payload.get("vendor_name"), created_by=created_by
                        )
                if not item and payload.get("item_name_label"):
                    item = Item_Model.objects.filter(name=payload.get("item_name_label")).first()
                    if not item:
                        item = Item_Model.objects.create(
                            name=payload.get("item_name_label"), created_by=created_by
                        )
                if not vendor or not item:
                    return Response(
                        {"detail": "Vendor or item no longer exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                obj = Vendor_Model.objects.create(
                    vendor=vendor,
                    item_name=item,
                    rate=payload.get("rate") or 0,
                    created_by=created_by,
                )
            elif record.model_name == "wax_receive":
                vendor_id = payload.get("vendor")
                vendor = VendorList_Model.objects.filter(pk=vendor_id).first()
                if not vendor:
                    return Response(
                        {"detail": "Vendor no longer exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if WaxReceive.objects.filter(vendor=vendor).exists():
                    return Response(
                        {"detail": "Record already there and it will create conflict."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                obj = WaxReceive.objects.create(vendor=vendor, created_by=created_by)
                lines = payload.get("lines") or []
                for line in lines:
                    item = Item_Model.objects.filter(pk=line.get("item")).first()
                    size = Size_Model.objects.filter(pk=line.get("size")).first()
                    if not item or not size:
                        continue
                    WaxReceiveLine.objects.create(
                        wax_receive=obj,
                        item=item,
                        size=size,
                        in_weight=Decimal(str(line.get("in_weight") or 0)),
                        in_quantity=int(line.get("in_quantity") or 0),
                        rate=Decimal(str(line.get("rate") or 0)),
                    )
            elif record.model_name == "issue_master":
                item = Item_Model.objects.filter(pk=payload.get("item")).first()
                size = Size_Model.objects.filter(pk=payload.get("size")).first()
                if not item or not size:
                    return Response(
                        {"detail": "Item or size no longer exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                obj = IssueMaster.objects.create(
                    item=item,
                    size=size,
                    out_weight=payload.get("out_weight") or 0,
                    out_quantity=payload.get("out_quantity") or 0,
                    description=payload.get("description") or "",
                    created_by=created_by,
                )
            elif record.model_name == "wax_receive_line":
                wax_receive = WaxReceive.objects.filter(pk=payload.get("wax_receive")).first()
                if not wax_receive:
                    vendor_name = payload.get("vendor_name")
                    wax_dt = payload.get("wax_receive_date_time")
                    if vendor_name:
                        queryset = WaxReceive.objects.filter(
                            vendor__vendor_name=vendor_name
                        ).order_by("-date_time")
                        if wax_dt:
                            wax_receive = queryset.filter(date_time=wax_dt).first()
                        if not wax_receive:
                            wax_receive = queryset.first()
                    if not wax_receive and vendor_name:
                        vendor = VendorList_Model.objects.filter(vendor_name=vendor_name).first()
                        if vendor:
                            wax_receive = WaxReceive.objects.create(
                                vendor=vendor, created_by=created_by
                            )
                item = Item_Model.objects.filter(pk=payload.get("item")).first()
                if not item and payload.get("item_name"):
                    item = Item_Model.objects.filter(name=payload.get("item_name")).first()
                size = Size_Model.objects.filter(pk=payload.get("size")).first()
                if not size and payload.get("size_name"):
                    size = Size_Model.objects.filter(name=payload.get("size_name")).first()
                if not wax_receive or not item or not size:
                    return Response(
                        {"detail": "Wax receive, item, or size no longer exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                obj = WaxReceiveLine.objects.create(
                    wax_receive=wax_receive,
                    item=item,
                    size=size,
                    in_weight=Decimal(str(payload.get("in_weight") or 0)),
                    in_quantity=int(payload.get("in_quantity") or 0),
                    rate=Decimal(str(payload.get("rate") or 0)),
                )
            else:
                return Response(
                    {"detail": "Recovery not supported for this record."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as exc:
            return Response(
                {"detail": f"Unable to recover record: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.delete()
        return Response({"detail": "Recovered", "id": obj.id}, status=status.HTTP_200_OK)
