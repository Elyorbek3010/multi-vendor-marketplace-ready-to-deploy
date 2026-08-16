from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, ProductReviewView, CanReviewProductView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', ProductViewSet, basename='product')

urlpatterns = [
    path('<uuid:product_id>/reviews/', ProductReviewView.as_view(), name='product-reviews'),
    path('<uuid:product_id>/can_review/', CanReviewProductView.as_view(), name='can-review-product'),
    path('', include(router.urls)),
]
