from django.db.models import QuerySet
from .models import Product, Category
from apps.vendors.models import VendorProfile

def get_active_products() -> QuerySet[Product]:
    return Product.objects.filter(is_active=True)

def get_vendor_products(vendor: VendorProfile) -> QuerySet[Product]:
    return Product.objects.filter(vendor=vendor)

def get_products_by_category(category_slug: str) -> QuerySet[Product]:
    return Product.objects.filter(category__slug=category_slug, is_active=True)

def get_all_categories() -> QuerySet[Category]:
    return Category.objects.all()
