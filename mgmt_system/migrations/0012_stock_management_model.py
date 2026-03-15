from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0011_waxreceive_vendor_list"),
    ]

    operations = [
        migrations.CreateModel(
            name="StockManagement_Model",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("in_weight", models.DecimalField(decimal_places=3, default=0, max_digits=12)),
                ("in_quantity", models.IntegerField(default=0)),
                ("out_weight", models.DecimalField(decimal_places=3, default=0, max_digits=12)),
                ("out_quantity", models.IntegerField(default=0)),
                ("balance_weight", models.DecimalField(decimal_places=3, default=0, max_digits=12)),
                ("balance_quantity", models.IntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_rows",
                        to="mgmt_system.item_model",
                    ),
                ),
                (
                    "size",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_rows",
                        to="mgmt_system.size_model",
                    ),
                ),
            ],
            options={
                "verbose_name": "Stock Management",
                "verbose_name_plural": "Stock Management",
                "ordering": ["item__name", "size__name"],
                "unique_together": {("item", "size")},
            },
        ),
    ]
