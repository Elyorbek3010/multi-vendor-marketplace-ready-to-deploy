from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user-register')
        self.login_url = reverse('token_obtain_pair')

    def test_register_buyer_success(self):
        data = {
            'email': 'buyer@example.com',
            'password': 'testpassword123',
            'role': 'BUYER'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(User.objects.filter(email='buyer@example.com').exists())

        user = User.objects.get(email='buyer@example.com')
        self.assertEqual(user.role, 'BUYER')

    def test_register_admin_blocked(self):
        data = {
            'email': 'admin@example.com',
            'password': 'testpassword123',
            'role': 'ADMIN'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='admin@example.com').exists())

    def test_login_returns_jwt(self):

        User.objects.create_user(
            email='test@example.com',
            username="testuser", 
            password='login@example.com', 
            role='BUYER')

        data = {
            'email': 'test@example.com',
            'password': 'login@example.com'
        }

        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)  