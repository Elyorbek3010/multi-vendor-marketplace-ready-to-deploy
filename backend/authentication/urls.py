from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import (
    UserProfileView,
    ChangePasswordView,
    UserRegisterView,
    EmailTokenObtainPairView,
)

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user-me'),
    path('password-change/', ChangePasswordView.as_view(), name='password-change'),
]
