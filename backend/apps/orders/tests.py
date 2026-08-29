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


        


        

        

        
