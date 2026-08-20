from rest_framework import viewsets, permissions, status, parsers, generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from .models import Product, Category, Review
from .serializers import ProductSerializer, CategorySerializer, ReviewSerializer
from apps.orders.models import Order
from rest_framework.exceptions import PermissionDenied
from .permissions import IsVendorOwnerOrReadOnly
from . import services, selectors
from apps.vendors.models import VendorProfile

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsVendorOwnerOrReadOnly]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'vendor', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'created_at', 'average_rating']

    def get_queryset(self):
        qs = selectors.get_active_products()
        user = self.request.user
        
        # Strictly isolate products for vendors so they cannot see/modify other vendors' items
        if user.is_authenticated and getattr(user, 'role', None) == 'VENDOR' and hasattr(user, 'vendor_profile'):
            qs = qs.filter(vendor=user.vendor_profile)
            
        qs = qs.annotate(
            average_rating=Avg('reviews__rating'),
            review_count=Count('reviews', distinct=True)
        )
            
        return qs

    def perform_create(self, serializer):
        try:
            vendor_profile = VendorProfile.objects.get(user=self.request.user)
        except VendorProfile.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(detail="User is not a registered vendor or lacks a vendor profile.")
        
        category = serializer.validated_data.get('category')
        product = services.create_product(
            vendor=vendor_profile,
            category=category,
            title=serializer.validated_data.get('title'),
            description=serializer.validated_data.get('description'),
            price=serializer.validated_data.get('price'),
            options=serializer.validated_data.get('options')
        )

        image = self.request.FILES.get('image')
        if image:
            from .models import ProductImage
            ProductImage.objects.create(product=product, image=image)
        
        stock = self.request.data.get('stock')
        if stock is not None:
            services.update_inventory_stock(product, int(stock))
            
        serializer.instance = product

    def perform_update(self, serializer):
        product = serializer.save()
        
        image = self.request.FILES.get('image')
        if image:
            from .models import ProductImage
            # Replace the old images with the new one
            ProductImage.objects.filter(product=product).delete()
            ProductImage.objects.create(product=product, image=image)
            
        stock = self.request.data.get('stock')
        if stock is not None:
            services.update_inventory_stock(product, int(stock))

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

class ProductReviewView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs['product_id']).order_by('-created_at')

    def perform_create(self, serializer):
        product_id = self.kwargs['product_id']
        product = get_object_or_404(Product, id=product_id)
        user = self.request.user
        
        has_purchased = Order.objects.filter(
            buyer=user, 
            status='DELIVERED', 
            items__product=product
        ).exists()
        
        if not has_purchased:
            raise PermissionDenied("You can only review products that you have purchased and received.")
            
        from rest_framework import serializers
        if Review.objects.filter(product=product, buyer=user).exists():
            raise serializers.ValidationError({"detail": "You have already reviewed this product."})
            
        serializer.save(buyer=user, product=product)

class CanReviewProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        has_purchased = Order.objects.filter(
            buyer=request.user, 
            status='DELIVERED', 
            items__product=product
        ).exists()
        has_reviewed = Review.objects.filter(product=product, buyer=request.user).exists()
        
        can_review = has_purchased and not has_reviewed
        return Response({'can_review': can_review})
