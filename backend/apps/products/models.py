from django.db import models
from django.conf import settings
from common.models import UUIDModel, TimeStampedModel
from apps.vendors.models import VendorProfile

class Category(UUIDModel, TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(UUIDModel, TimeStampedModel):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    options = models.JSONField(default=dict, blank=True, help_text='e.g. {"Size": ["S", "M", "L"], "Color": ["Red", "Blue"]}')

    def __str__(self):
        return self.title

class ProductImage(UUIDModel, TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/', null=True, blank=True)
    image_url = models.URLField(blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True)

class Inventory(UUIDModel, TimeStampedModel):

    class Meta:
        verbose_name = "Inventory"
        verbose_name_plural = "Inventories"

    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)

class Review(UUIDModel, TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ('product', 'buyer')
        
    def __str__(self):
        return f"{self.rating} stars by {self.buyer.username} for {self.product.title}"
