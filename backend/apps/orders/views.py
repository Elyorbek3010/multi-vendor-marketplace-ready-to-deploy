from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Order, Cart, CartItem
from apps.products.models import Product
from .serializers import OrderSerializer, VendorOrderSerializer, CartSerializer

class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if user.is_authenticated and getattr(user, 'role', None) == 'VENDOR' and hasattr(user, 'vendor_profile'):
            return VendorOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        if getattr(user, 'role', None) == 'VENDOR' and hasattr(user, 'vendor_profile'):
            return Order.objects.filter(items__product__vendor=user.vendor_profile).distinct().order_by('-created_at')
        return Order.objects.filter(buyer=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if user.is_authenticated and getattr(user, 'role', None) == 'VENDOR' and hasattr(user, 'vendor_profile'):
            return VendorOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'VENDOR' and hasattr(user, 'vendor_profile'):
            return Order.objects.filter(items__product__vendor=user.vendor_profile).distinct()
        return Order.objects.filter(buyer=user)

    def perform_update(self, serializer):
        serializer.save()

class OrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        if getattr(user, 'role', None) == 'VENDOR' and hasattr(user, 'vendor_profile'):
            order = get_object_or_404(Order.objects.distinct(), pk=pk, items__product__vendor=user.vendor_profile)
        else:
            order = get_object_or_404(Order, pk=pk, buyer=user)
            
        status = request.data.get('status')
        if status in dict(Order.Status.choices):
            from . import services
            services.update_order_status(order, status)
            return Response({'status': order.status})
        return Response({'error': 'Invalid status'}, status=400)

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        try:
            quantity = int(request.data.get('quantity', 1))
        except (ValueError, TypeError):
            quantity = 1
        
        selected_options = request.data.get('selected_options', {})

        product = get_object_or_404(Product, id=product_id)
        
        vendor_profile = getattr(request.user, 'vendor_profile', None)
        if vendor_profile and product.vendor_id == vendor_profile.id:
            return Response({'error': "You cannot purchase your own product."}, status=400)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'selected_options': selected_options})
        if not created:
            cart_item.quantity += quantity
            if selected_options:
                cart_item.selected_options = selected_options
        else:
            cart_item.quantity = quantity
            
        inventory = getattr(product, 'inventory', None)
        if inventory and cart_item.quantity > inventory.stock:
            cart_item.quantity = inventory.stock

        if cart_item.quantity <= 0:
            cart_item.delete()
        else:
            cart_item.save()

        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def put(self, request, product_id):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        try:
            quantity = int(request.data.get('quantity', 1))
        except (ValueError, TypeError):
            quantity = 1
        
        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        
        if quantity <= 0:
            cart_item.delete()
        else:
            inventory = getattr(cart_item.product, 'inventory', None)
            if inventory and quantity > inventory.stock:
                quantity = inventory.stock
            cart_item.quantity = quantity
            cart_item.save()

        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, product_id):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_item = get_object_or_404(CartItem, cart=cart, product_id=product_id)
        cart_item.delete()
        
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)