from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem, Cart, CartItem
from apps.products.models import Product, Inventory

class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(write_only=True, required=False)
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'product_title', 'product_image', 'quantity', 'price_at_purchase', 'selected_options']
        read_only_fields = ['product', 'price_at_purchase', 'product_title']

    def get_product_image(self, obj):
        image = obj.product.images.first()
        if image:
            request = self.context.get('request')
            if request and image.image:
                return request.build_absolute_uri(image.image.url)
            return getattr(image, 'image_url', None) or (image.image.url if image.image else None)
        return None

class VendorOrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['buyer', 'total_amount']

    def get_items(self, obj):
        request = self.context.get('request')
        vendor_profile = getattr(request.user, 'vendor_profile', None) if request else None
        
        if vendor_profile:
            items = obj.items.filter(product__vendor=vendor_profile)
        else:
            items = obj.items.all()
            
        return OrderItemSerializer(items, many=True, context=self.context).data

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['buyer', 'total_amount']

    def validate(self, attrs):
        request = self.context.get('request')
        items_data = self.initial_data.get('items', [])
        
        vendor_profile = getattr(request.user, 'vendor_profile', None)
        
        for item_data in items_data:
            product_id = item_data.get('product_id')
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError({"items": f"Product {product_id} does not exist."})
                
            if vendor_profile and product.vendor_id == vendor_profile.id:
                raise serializers.ValidationError("You cannot purchase your own product.")
                
        return attrs

    def create(self, validated_data):
        items_data = self.initial_data.get('items', [])
        if 'items' in validated_data:
            validated_data.pop('items')
            
        with transaction.atomic():
            order = Order.objects.create(**validated_data)
            
            total = 0
            for item_data in items_data:
                # Lock the inventory row to prevent race conditions during checkout
                inventory = Inventory.objects.select_for_update().get(product_id=item_data['product_id'])
                quantity = item_data.get('quantity', 1)
                selected_options = item_data.get('selected_options', {})
                
                if inventory.stock < quantity:
                    raise serializers.ValidationError({
                        "items": f"Insufficient stock for product. Available: {inventory.stock}, Requested: {quantity}"
                    })
                
                # Deduct stock
                inventory.stock -= quantity
                inventory.save()
                
                product = inventory.product
                price = product.price
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price_at_purchase=price,
                    selected_options=selected_options
                )
                total += price * quantity
                
            order.total_amount = total
            order.save()
            
            # Clear the cart after order
            cart = getattr(self.context.get('request').user, 'cart', None)
            if cart:
                cart.items.all().delete()
                
            return order

class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField()
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.SerializerMethodField()
    price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    stock = serializers.IntegerField(source='product.inventory.stock', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'product_title', 'product_image', 'price', 'quantity', 'stock', 'selected_options']

    def get_product_image(self, obj):
        image = obj.product.images.first()
        if image:
            request = self.context.get('request')
            if request and image.image:
                return request.build_absolute_uri(image.image.url)
            return getattr(image, 'image_url', None) or (image.image.url if image.image else None)
        return None

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_amount']

    def get_total_amount(self, obj):
        return sum(item.quantity * item.product.price for item in obj.items.all())
