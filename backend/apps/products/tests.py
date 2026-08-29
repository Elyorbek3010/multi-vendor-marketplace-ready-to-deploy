from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category

User = get_user_model()

class ProductPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.product_list_url = reverse('product-list')

        self.buyer = User.objects.create_user(
            email='buyer@example.com',
            username='buyer',
            password='password123',
            role='BUYER'
        )

        self.vendor1 = User.objects.create_user(
            email='vendor1@example.com',
            username='vendor1',
            password='password123',
            role='VENDOR'
        )

        self.vendor2 = User.objects.create_user(
            email='vendor2@example.com',
            username='vendor2',
            password='password123',
            role='VENDOR'
        )

        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )

        self.product = Product.objects.create(
            vendor=self.vendor1.vendor_profile,
            category=self.category,
            title='Test Product',
            description='Test Description',
            price=100.00,
            options={},
            is_active=True
        )

        self.product_url = reverse('product-detail', kwargs={'pk': self.product.pk})
    
    def test_buyer_cannot_create_product(self):
        self.client.force_authenticate(user=self.buyer)

        data = {
            'category': self.category.id,
            'title': 'Test Product',
            'description': 'Test Description',
            'price': 100.00,
            'options': {},
            'is_active': True
        }

        response = self.client.post(self.product_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_isolation(self):
        self.client.force_authenticate(user=self.vendor2)

        data = {
            'category': self.category.id,
            'title': 'Vendor2 Product',
            'description': 'Vendor2 Product Description',
            'price': 200.00,
            'options': {},
            'is_active': True
        }

        response = self.client.put(self.product_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        delete_response = self.client.delete(self.product_url)
        self.assertEqual(delete_response.status_code, status.HTTP_404_NOT_FOUND)
    
        


    

