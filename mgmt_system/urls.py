from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ItemModelViewSet,
    SizeModelViewSet,
    VendorModelViewSet,
    WaxReceiveViewSet,
    IssueMasterViewSet,
)

router = DefaultRouter()
router.register("size-models", SizeModelViewSet, basename="size-model")
router.register("item-models", ItemModelViewSet, basename="item-model")
router.register("vendor-models", VendorModelViewSet, basename="vendor-model")
router.register("wax-receives", WaxReceiveViewSet, basename="wax-receive")
router.register("issue-masters", IssueMasterViewSet, basename="issue-master")

urlpatterns = [
    path("", include(router.urls)),
]
