from django.db.models import QuerySet
from .models import Product, Category
from apps.vendors.models import VendorProfile

def get_active_products() -> QuerySet[Product]:
    """Retrieves a queryset of all products that are currently active."""
    return Product.objects.filter(is_active=True)

def get_vendor_products(vendor: VendorProfile) -> QuerySet[Product]:
    """Retrieves all products belonging to a specific vendor."""
    return Product.objects.filter(vendor=vendor)

def get_products_by_category(category_slug: str) -> QuerySet[Product]:
    """Retrieves all active products that belong to a specific category slug."""
    return Product.objects.filter(category__slug=category_slug, is_active=True)

def get_all_categories() -> QuerySet[Category]:
    """Returns a queryset of all available product categories."""
    return Category.objects.all()
