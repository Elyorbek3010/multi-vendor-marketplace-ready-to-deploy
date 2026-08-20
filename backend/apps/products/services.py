from .models import Product, Category, Inventory, ProductImage
from apps.vendors.models import VendorProfile

def create_product(vendor: VendorProfile, category: Category, title: str, description: str, price: float, options: dict = None) -> Product:
    product = Product.objects.create(
        vendor=vendor,
        category=category,
        title=title,
        description=description,
        price=price,
        options=options or {},
        is_active=True
    )
    # Auto-create inventory record
    Inventory.objects.create(product=product, stock=0)
    return product

def update_inventory_stock(product: Product, quantity: int) -> Inventory:
    inventory, created = Inventory.objects.get_or_create(product=product)
    inventory.stock = quantity
    inventory.save()
    return inventory

def add_product_image(product: Product, image_url: str, alt_text: str = "") -> ProductImage:
    return ProductImage.objects.create(
        product=product,
        image_url=image_url,
        alt_text=alt_text
    )
