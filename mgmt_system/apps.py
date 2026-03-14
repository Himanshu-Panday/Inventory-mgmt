from django.apps import AppConfig


class MgmtSystemConfig(AppConfig):
    name = 'mgmt_system'

    def ready(self):
        from auditlog.registry import auditlog
        from . import models

        auditlog.register(models.Item_Model)
        auditlog.register(models.Size_Model)
        auditlog.register(models.Vendor_Model)
        auditlog.register(models.WaxReceive)
        auditlog.register(models.WaxReceiveLine)
        auditlog.register(models.IssueMaster)
