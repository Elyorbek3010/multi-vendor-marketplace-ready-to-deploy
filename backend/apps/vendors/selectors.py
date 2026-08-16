from django.db.models import QuerySet
from .models import VendorProfile

def get_vendor_profile(user) -> VendorProfile:
    return VendorProfile.objects.filter(user=user).first()

def get_active_vendors() -> QuerySet[VendorProfile]:
    return VendorProfile.objects.filter(is_approved=True)
