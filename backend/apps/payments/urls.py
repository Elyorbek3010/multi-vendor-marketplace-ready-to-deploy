from django.urls import path
from .views import CreateStripeCheckoutSessionView, StripeWebhookView

urlpatterns = [
    path('stripe/create-checkout-session/<uuid:order_id>/', CreateStripeCheckoutSessionView.as_view(), name='create-stripe-checkout'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
