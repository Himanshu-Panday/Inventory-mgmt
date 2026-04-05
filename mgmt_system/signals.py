from django.db.models import Sum
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import IssueMaster, StockManagement_Model, WaxReceiveLine


def _recalc_stock(item_id, size_id):
    if not size_id:
        return
    in_totals = WaxReceiveLine.objects.filter(
        item_id=item_id, size_id=size_id, is_active=True, wax_receive__is_active=True
    ).aggregate(
        total_weight=Sum("in_weight"),
        total_quantity=Sum("in_quantity"),
    )
    out_totals = IssueMaster.objects.filter(
        item_id=item_id, size_id=size_id, is_active=True
    ).aggregate(
        total_weight=Sum("out_weight"),
        total_quantity=Sum("out_quantity"),
    )

    in_weight = in_totals["total_weight"] or 0
    in_quantity = in_totals["total_quantity"] or 0
    out_weight = out_totals["total_weight"] or 0
    out_quantity = out_totals["total_quantity"] or 0

    balance_weight = in_weight - out_weight
    balance_quantity = in_quantity - out_quantity

    StockManagement_Model.objects.update_or_create(
        item_id=item_id,
        size_id=size_id,
        defaults={
            "in_weight": in_weight,
            "in_quantity": in_quantity,
            "out_weight": out_weight,
            "out_quantity": out_quantity,
            "balance_weight": balance_weight,
            "balance_quantity": balance_quantity,
        },
    )


@receiver(pre_save, sender=WaxReceiveLine)
def cache_wax_line_original(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_item_id = None
        instance._old_size_id = None
        return
    try:
        previous = WaxReceiveLine.objects.get(pk=instance.pk)
    except WaxReceiveLine.DoesNotExist:
        instance._old_item_id = None
        instance._old_size_id = None
        return
    instance._old_item_id = previous.item_id
    instance._old_size_id = previous.size_id


@receiver(post_save, sender=WaxReceiveLine)
def update_stock_from_wax_line(sender, instance, **kwargs):
    old_item_id = getattr(instance, "_old_item_id", None)
    old_size_id = getattr(instance, "_old_size_id", None)
    if old_item_id and old_size_id and (
        old_item_id != instance.item_id or old_size_id != instance.size_id
    ):
        _recalc_stock(old_item_id, old_size_id)
    _recalc_stock(instance.item_id, instance.size_id)


@receiver(post_delete, sender=WaxReceiveLine)
def update_stock_from_wax_line_delete(sender, instance, **kwargs):
    _recalc_stock(instance.item_id, instance.size_id)


@receiver(pre_save, sender=IssueMaster)
def cache_issue_original(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_item_id = None
        instance._old_size_id = None
        return
    try:
        previous = IssueMaster.objects.get(pk=instance.pk)
    except IssueMaster.DoesNotExist:
        instance._old_item_id = None
        instance._old_size_id = None
        return
    instance._old_item_id = previous.item_id
    instance._old_size_id = previous.size_id


@receiver(post_save, sender=IssueMaster)
def update_stock_from_issue(sender, instance, **kwargs):
    old_item_id = getattr(instance, "_old_item_id", None)
    old_size_id = getattr(instance, "_old_size_id", None)
    if old_item_id and old_size_id and (
        old_item_id != instance.item_id or old_size_id != instance.size_id
    ):
        _recalc_stock(old_item_id, old_size_id)
    _recalc_stock(instance.item_id, instance.size_id)


@receiver(post_delete, sender=IssueMaster)
def update_stock_from_issue_delete(sender, instance, **kwargs):
    _recalc_stock(instance.item_id, instance.size_id)
