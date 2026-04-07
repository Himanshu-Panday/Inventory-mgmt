from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0021_stock_management_backfill_null_size"),
    ]

    operations = [
        migrations.AlterField(
            model_name="issuemaster",
            name="size",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="issues",
                to="mgmt_system.size_model",
            ),
        ),
    ]

