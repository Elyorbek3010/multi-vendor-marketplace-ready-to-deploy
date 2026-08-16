from django.contrib import admin
from .models import Category, Product, ProductImage, Inventory

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'created_at')
    list_filter = ('parent',)
    search_fields = ('name', 'slug')
    readonly_fields = ('id', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('name',)}

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'vendor', 'category', 'price', 'is_active', 'created_at')
    list_filter = ('is_active', 'category', 'vendor')
    search_fields = ('title', 'description', 'vendor__store_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [ProductImageInline]

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'stock', 'low_stock_threshold', 'created_at')
    list_filter = ('stock', 'low_stock_threshold')
    search_fields = ('product__title',)
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_url', 'created_at')
    search_fields = ('product__title', 'alt_text')
    readonly_fields = ('id', 'created_at', 'updated_at')
