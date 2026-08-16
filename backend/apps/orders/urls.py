from django.urls import path
from .views import OrderListCreateView, OrderDetailView, OrderStatusUpdateView, CartView, CartItemView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemView.as_view(), name='cart-item-create'),
    path('cart/items/<uuid:product_id>/', CartItemView.as_view(), name='cart-item-detail'),
    path('', OrderListCreateView.as_view(), name='order-list'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:pk>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
]
