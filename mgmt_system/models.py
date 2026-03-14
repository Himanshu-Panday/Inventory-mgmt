from django.conf import settings
from django.db import models


class BaseMasterModel(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["created_at"]

    def __str__(self):
        return self.name


class Size_Model(BaseMasterModel):
    class Meta(BaseMasterModel.Meta):
        verbose_name = "Size Model"
        verbose_name_plural = "Size Models"


class Item_Model(BaseMasterModel):
    class Meta(BaseMasterModel.Meta):
        verbose_name = "Item Model"
        verbose_name_plural = "Item Models"


class Vendor_Model(models.Model):
    vendor_name = models.CharField(max_length=255)
    item_name = models.ForeignKey(
        Item_Model,
        on_delete=models.PROTECT,
        related_name="vendors",
    )
    rate = models.IntegerField()
    date_time = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_model_created",
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Vendor Model"
        verbose_name_plural = "Vendor Models"

    def __str__(self):
        return self.vendor_name


class WaxReceive(models.Model):
    vendor = models.ForeignKey(
        Vendor_Model,
        on_delete=models.PROTECT,
        related_name="wax_receives",
    )
    date_time = models.DateTimeField(auto_now_add=True)
    weight = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    quantity = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wax_receive_created",
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Wax Receive"
        verbose_name_plural = "Wax Receives"

    def __str__(self):
        return f"Wax Receive {self.id}"

    def recalc_totals(self):
        totals = self.lines.aggregate(
            total_weight=models.Sum("in_weight"),
            total_quantity=models.Sum("in_quantity"),
            total_amount=models.Sum("amount"),
        )
        self.weight = totals["total_weight"] or 0
        self.quantity = totals["total_quantity"] or 0
        self.total_amount = totals["total_amount"] or 0

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Child lines may not exist yet. If they do, recompute.
        self.recalc_totals()
        super().save(update_fields=["weight", "quantity", "total_amount"])


class WaxReceiveLine(models.Model):
    wax_receive = models.ForeignKey(
        WaxReceive,
        on_delete=models.CASCADE,
        related_name="lines",
    )
    item = models.ForeignKey(Item_Model, on_delete=models.PROTECT, related_name="wax_receive_lines")
    size = models.ForeignKey(Size_Model, on_delete=models.PROTECT, related_name="wax_receive_lines")
    in_weight = models.DecimalField(max_digits=12, decimal_places=3)
    in_quantity = models.IntegerField()
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        self.amount = (self.in_weight or 0) * (self.rate or 0)
        super().save(*args, **kwargs)
        self.wax_receive.recalc_totals()
        self.wax_receive.save(update_fields=["weight", "quantity", "total_amount"])

    def delete(self, *args, **kwargs):
        wax_receive = self.wax_receive
        super().delete(*args, **kwargs)
        wax_receive.recalc_totals()
        wax_receive.save(update_fields=["weight", "quantity", "total_amount"])


class IssueMaster(models.Model):
    item = models.ForeignKey(Item_Model, on_delete=models.PROTECT, related_name="issues")
    size = models.ForeignKey(Size_Model, on_delete=models.PROTECT, related_name="issues")
    out_weight = models.DecimalField(max_digits=12, decimal_places=3)
    out_quantity = models.IntegerField()
    description = models.TextField(blank=True)
    date_time = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issue_master_created",
    )

    class Meta:
        ordering = ["id"]
        verbose_name = "Issue Master"
        verbose_name_plural = "Issue Masters"

    def __str__(self):
        return f"Issue {self.id}"

