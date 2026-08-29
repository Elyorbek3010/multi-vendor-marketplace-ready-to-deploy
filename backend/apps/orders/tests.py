from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.orders.models import Order, Cart, CartItem

User = get_user_model()


class OrderCreationTests(TestCase):

    fixtures = ["orders_test_data.json"]

    def setUp(self):
        self.client = APIClient()
        self.order_url = reverse("order-list")

        self.buyer = User.objects.get(pk="11111111-1111-1111-1111-111111111111")

    def test_create_order_success(self):
        self.client.force_authenticate(user=self.buyer)

        data = {
            "items": [
                {
                    "product_id": "55555555-5555-5555-5555-555555555555",
                    "quantity": 3
                }
            ]
        }

        response = self.client.post(self.order_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

    
    def test_buyer_cannot_update_status(self):
        
        order = Order.objects.create(
            buyer=self.buyer,
            status=Order.Status.PENDING,
            total_amount=100.00
        )
        
        
        status_url = reverse("order-status-update", kwargs={"pk": order.pk})
        
        self.client.force_authenticate(user=self.buyer)
        
        data = {"status": "SHIPPED"}
        response = self.client.patch(status_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_stock_decrements_on_purchase(self):
        
        from apps.products.models import Inventory 
        
        
        inventory = Inventory.objects.get(product_id="55555555-5555-5555-5555-555555555555")
        self.assertEqual(inventory.stock, 10)
        
        self.client.force_authenticate(user=self.buyer)
        
        data = {
            "items": [
                {
                    "product_id": "55555555-5555-5555-5555-555555555555",
                    "quantity": 3
                }
            ]
        }
        self.client.post(self.order_url, data, format='json')
        
        inventory.refresh_from_db()
        
        self.assertEqual(inventory.stock, 7)

    def test_buyer_can_cancel_order_and_restores_stock(self):
        from apps.products.models import Inventory 
        
        inventory = Inventory.objects.get(product_id="55555555-5555-5555-5555-555555555555")
        initial_stock = inventory.stock
        
        # 1. Buy 3 items
        self.client.force_authenticate(user=self.buyer)
        data = {"items": [{"product_id": "55555555-5555-5555-5555-555555555555", "quantity": 3}]}
        response = self.client.post(self.order_url, data, format='json')
        order_id = response.data['id']
        
        inventory.refresh_from_db()
        self.assertEqual(inventory.stock, initial_stock - 3)
        
        # 2. Cancel the order
        cancel_url = reverse("order-cancel", kwargs={"pk": order_id})
        cancel_response = self.client.post(cancel_url, format='json')
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        
        # 3. Verify status and stock
        order = Order.objects.get(pk=order_id)
        self.assertEqual(order.status, Order.Status.CANCELLED)
        
        inventory.refresh_from_db()
        self.assertEqual(inventory.stock, initial_stock)

    def test_cannot_cancel_shipped_order(self):
        order = Order.objects.create(buyer=self.buyer, status=Order.Status.SHIPPED, total_amount=100.00)
        self.client.force_authenticate(user=self.buyer)
        
        cancel_url = reverse("order-cancel", kwargs={"pk": order.pk})
        response = self.client.post(cancel_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot cancel an order that has already been shipped', str(response.data))

        


        

        

        
