import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")
django.setup()

from apps.vendors.models import VendorProfile
from authentication.models import CustomUser
from rest_framework.test import APIClient

user, _ = CustomUser.objects.get_or_create(username='testvendor', email='test@test.com')
vendor, _ = VendorProfile.objects.get_or_create(user=user, store_name='Test Store')

client = APIClient()
client.force_authenticate(user=user)

data = {
    'title': 'Product 1',
    'description': 'Desc',
    'price': '10.00',
    'stock': '5',
}
print("Creating product 1...")
res = client.post('/api/products/items/', data, format='multipart')
print(res.status_code, res.data)

data2 = {
    'title': 'Product 2',
    'description': 'Desc',
    'price': '20.00',
    'stock': '15',
}
print("Creating product 2...")
res2 = client.post('/api/products/items/', data2, format='multipart')
print(res2.status_code, getattr(res2, 'data', res2.content))
