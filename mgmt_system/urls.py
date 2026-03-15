from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ItemModelViewSet,
    SizeModelViewSet,
    VendorModelViewSet,
    VendorListViewSet,
    WaxReceiveViewSet,
    WaxReceiveLineViewSet,
    IssueMasterViewSet,
    StockManagementViewSet,
    DeletedRecordViewSet,
)

router = DefaultRouter()
router.register("size-models", SizeModelViewSet, basename="size-model")
router.register("item-models", ItemModelViewSet, basename="item-model")
router.register("vendor-lists", VendorListViewSet, basename="vendor-list")
router.register("vendor-models", VendorModelViewSet, basename="vendor-model")
router.register("wax-receives", WaxReceiveViewSet, basename="wax-receive")
router.register("wax-receive-lines", WaxReceiveLineViewSet, basename="wax-receive-line")
router.register("issue-masters", IssueMasterViewSet, basename="issue-master")
router.register("stock-management", StockManagementViewSet, basename="stock-management")
router.register("deleted-records", DeletedRecordViewSet, basename="deleted-record")

urlpatterns = [
    path("", include(router.urls)),
]
