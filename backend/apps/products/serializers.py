from rest_framework import serializers
from .models import Product, Category, Inventory, ProductImage, Review

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'alt_text']

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['stock', 'low_stock_threshold']

class ReviewSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'buyer_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['product', 'buyer_name', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    inventory = InventorySerializer(read_only=True)
    average_rating = serializers.FloatField(read_only=True, required=False)
    review_count = serializers.IntegerField(read_only=True, required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    
    def validate_options(self, value):
        if isinstance(value, str):
            import json
            try:
                return json.loads(value)
            except ValueError:
                return {}
        return value
    
    class Meta:
        model = Product
        fields = ['id', 'vendor', 'category', 'title', 'description', 'price', 'is_active', 'options', 'images', 'inventory', 'average_rating', 'review_count', 'created_at']
        read_only_fields = ['id', 'vendor', 'created_at']
