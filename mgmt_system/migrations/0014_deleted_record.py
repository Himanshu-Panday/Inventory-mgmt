from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0013_stock_management_backfill"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DeletedRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("model_name", models.CharField(max_length=50)),
                ("object_id", models.CharField(max_length=50)),
                ("payload", models.JSONField()),
                ("deleted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="deleted_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Deleted Record",
                "verbose_name_plural": "Deleted Records",
                "ordering": ["-deleted_at"],
            },
        ),
    ]
