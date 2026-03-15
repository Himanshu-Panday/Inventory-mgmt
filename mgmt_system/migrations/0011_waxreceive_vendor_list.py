from django.db import migrations, models
import django.db.models.deletion


def copy_wax_receive_vendor(apps, schema_editor):
    WaxReceive = apps.get_model("mgmt_system", "WaxReceive")
    VendorModel = apps.get_model("mgmt_system", "Vendor_Model")
    for wax_receive in WaxReceive.objects.select_related("vendor").all():
        vendor_model = getattr(wax_receive, "vendor", None)
        if isinstance(vendor_model, VendorModel):
            wax_receive.vendor_list = vendor_model.vendor
            wax_receive.save(update_fields=["vendor_list"])


def reverse_copy_wax_receive_vendor(apps, schema_editor):
    WaxReceive = apps.get_model("mgmt_system", "WaxReceive")
    VendorModel = apps.get_model("mgmt_system", "Vendor_Model")
    for wax_receive in WaxReceive.objects.select_related("vendor_list").all():
        vendor_list = getattr(wax_receive, "vendor_list", None)
        if vendor_list:
            vendor_model = VendorModel.objects.filter(vendor=vendor_list).first()
            if vendor_model:
                wax_receive.vendor = vendor_model
                wax_receive.save(update_fields=["vendor"])


class Migration(migrations.Migration):
    dependencies = [
        ("mgmt_system", "0010_merge_0009_remove_history_0009_vendor_list"),
    ]

    operations = [
        migrations.AddField(
            model_name="waxreceive",
            name="vendor_list",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="wax_receives",
                to="mgmt_system.vendorlist_model",
            ),
        ),
        migrations.RunPython(copy_wax_receive_vendor, reverse_copy_wax_receive_vendor),
        migrations.RemoveField(
            model_name="waxreceive",
            name="vendor",
        ),
        migrations.RenameField(
            model_name="waxreceive",
            old_name="vendor_list",
            new_name="vendor",
        ),
    ]
