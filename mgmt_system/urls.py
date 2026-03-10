from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ItemModelViewSet, SizeModelViewSet, VendorModelViewSet

router = DefaultRouter()
router.register("size-models", SizeModelViewSet, basename="size-model")
router.register("item-models", ItemModelViewSet, basename="item-model")
router.register("vendor-models", VendorModelViewSet, basename="vendor-model")

urlpatterns = [
    path("", include(router.urls)),
]
