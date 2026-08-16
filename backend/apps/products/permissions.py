from rest_framework import permissions
from apps.vendors.models import VendorProfile

class IsVendorOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow vendors of a product to edit it.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'VENDOR'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        vendor_profile = VendorProfile.objects.filter(user=request.user).first()
        return obj.vendor == vendor_profile
