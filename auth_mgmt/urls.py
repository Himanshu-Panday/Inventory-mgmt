from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    JWTLoginView,
    LoginView,
    MasterOptionsView,
    MeView,
    RegisterView,
    UserDetailView,
    UserListCreateView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/", JWTLoginView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("masters/", MasterOptionsView.as_view(), name="masters"),
    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user_detail"),
]
