from django.db import migrations


def backfill_stock(apps, schema_editor):
    Stock = apps.get_model("mgmt_system", "StockManagement_Model")
    WaxReceiveLine = apps.get_model("mgmt_system", "WaxReceiveLine")
    IssueMaster = apps.get_model("mgmt_system", "IssueMaster")
    from django.db.models import Sum

    item_size_pairs = set(
        WaxReceiveLine.objects.values_list("item_id", "size_id").distinct()
    )
    item_size_pairs.update(
        IssueMaster.objects.values_list("item_id", "size_id").distinct()
    )

    for item_id, size_id in item_size_pairs:
        in_totals = WaxReceiveLine.objects.filter(item_id=item_id, size_id=size_id).aggregate(
            total_weight=Sum("in_weight"),
            total_quantity=Sum("in_quantity"),
        )
        out_totals = IssueMaster.objects.filter(item_id=item_id, size_id=size_id).aggregate(
            total_weight=Sum("out_weight"),
            total_quantity=Sum("out_quantity"),
        )

        in_weight = in_totals["total_weight"] or 0
        in_quantity = in_totals["total_quantity"] or 0
        out_weight = out_totals["total_weight"] or 0
        out_quantity = out_totals["total_quantity"] or 0

        Stock.objects.update_or_create(
            item_id=item_id,
            size_id=size_id,
            defaults={
                "in_weight": in_weight,
                "in_quantity": in_quantity,
                "out_weight": out_weight,
                "out_quantity": out_quantity,
                "balance_weight": in_weight - out_weight,
                "balance_quantity": in_quantity - out_quantity,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0020_alter_stockmanagement_size_nullable"),
    ]

    operations = [
        migrations.RunPython(backfill_stock, migrations.RunPython.noop),
    ]
