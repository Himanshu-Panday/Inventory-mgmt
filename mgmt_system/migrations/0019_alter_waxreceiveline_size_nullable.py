from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0018_delete_deletedrecord"),
    ]

    operations = [
        migrations.AlterField(
            model_name="waxreceiveline",
            name="size",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="wax_receive_lines",
                to="mgmt_system.size_model",
            ),
        ),
    ]
