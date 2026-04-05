from django.apps import AppConfig


class MgmtSystemConfig(AppConfig):
    name = 'mgmt_system'

    def ready(self):
        from auditlog.registry import auditlog
        from . import models
        from . import signals  # noqa: F401

        auditlog.register(models.Item_Model)
        auditlog.register(models.Size_Model)
        auditlog.register(models.Vendor_Model)
        auditlog.register(models.VendorList_Model)
        auditlog.register(models.WaxReceive)
        auditlog.register(models.WaxReceiveLine)
        auditlog.register(models.IssueMaster)
        auditlog.register(models.StockManagement_Model)
