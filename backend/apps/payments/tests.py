from django.test import TestCase
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.orders.models import Order
import stripe

User = get_user_model()

class StripePaymentTests(TestCase):
    fixtures = ["orders_test_data.json"]

    def setUp(self):
        self.client = APIClient()
        self.buyer = User.objects.get(pk="11111111-1111-1111-1111-111111111111")
        
        # Create a pending order for testing
        self.order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PENDING,
            total_amount=50.00
        )

    @patch('stripe.checkout.Session.create')
    def test_create_checkout_session_success(self, mock_stripe_create):
        # 1. Setup the mock to return a fake URL
        mock_stripe_create.return_value = MagicMock(url="https://checkout.stripe.com/fake-url")

        # 2. Authenticate and hit the endpoint
        self.client.force_authenticate(user=self.buyer)
        url = reverse('create-stripe-checkout', kwargs={'order_id': self.order.id})
        response = self.client.post(url)

        # 3. Verify it worked
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['payment_link'], "https://checkout.stripe.com/fake-url")
        
        # 4. Verify Stripe was called with the correct data
        mock_stripe_create.assert_called_once()
        call_args = mock_stripe_create.call_args[1]
        self.assertEqual(call_args['client_reference_id'], str(self.order.id))
        self.assertEqual(call_args['line_items'][0]['price_data']['unit_amount'], 5000) # 50.00 * 100

    def test_create_checkout_session_unauthorized(self):
        url = reverse('create-stripe-checkout', kwargs={'order_id': self.order.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('stripe.Webhook.construct_event')
    def test_stripe_webhook_marks_order_paid(self, mock_construct_event):
        # 1. Setup the mock event payload that Stripe would send
        session = MagicMock()
        session.client_reference_id = str(self.order.id)
        session.id = "cs_test_123"

        mock_construct_event.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': session
            }
        }

        # 2. Hit the webhook endpoint
        url = reverse('stripe-webhook')
        response = self.client.post(url, data=b"fake_payload", content_type="application/json", HTTP_STRIPE_SIGNATURE="fake_signature")

        # 3. Verify the response and database
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.PAID)
