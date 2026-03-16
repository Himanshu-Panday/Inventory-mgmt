from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0014_deleted_record"),
    ]

    operations = [
        migrations.AddField(
            model_name="waxreceiveline",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="wax_receive_lines/"),
        ),
    ]
