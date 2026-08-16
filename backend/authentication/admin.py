from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'id', 'created_at', 'updated_at')}),
    )
