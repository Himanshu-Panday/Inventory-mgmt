from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0019_alter_waxreceiveline_size_nullable"),
    ]

    operations = [
        migrations.AlterField(
            model_name="stockmanagement_model",
            name="size",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="stock_rows",
                to="mgmt_system.size_model",
            ),
        ),
    ]
