from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from django.forms.models import model_to_dict
from django.db.models.fields.files import FieldFile

from .models import (
    DeletedRecord,
    IssueMaster,
    Item_Model,
    Size_Model,
    Vendor_Model,
    VendorList_Model,
    WaxReceive,
    WaxReceiveLine,
)


MODEL_KEYS = {
    Item_Model: "item_model",
    Size_Model: "size_model",
    VendorList_Model: "vendor_list",
    Vendor_Model: "vendor_model",
    WaxReceive: "wax_receive",
    WaxReceiveLine: "wax_receive_line",
    IssueMaster: "issue_master",
}


def _base_payload(instance):
    payload = model_to_dict(instance)
    payload["id"] = instance.pk
    return make_json_safe(payload)


def make_json_safe(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, FieldFile):
        return value.name or ""
    if isinstance(value, dict):
        return {key: make_json_safe(val) for key, val in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [make_json_safe(val) for val in value]
    return value


def archive_deleted_record(instance, user, extra_payload=None):
    model_key = MODEL_KEYS.get(instance.__class__)
    if not model_key:
        return

    payload = _base_payload(instance)
    if extra_payload:
        payload.update(make_json_safe(extra_payload))

    DeletedRecord.objects.create(
        model_name=model_key,
        object_id=str(instance.pk),
        payload=payload,
        deleted_by=user if getattr(user, "is_authenticated", False) else None,
    )
