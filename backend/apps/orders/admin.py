from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    readonly_fields = ('id', 'created_at', 'updated_at', 'price_at_purchase')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'buyer__username', 'buyer__email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'total_amount')
    inlines = [OrderItemInline]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price_at_purchase', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('order__id', 'product__title')
    readonly_fields = ('id', 'created_at', 'updated_at', 'price_at_purchase')
