from django.db.models import QuerySet
from .models import VendorProfile

def get_vendor_profile(user) -> VendorProfile:
    """Retrieves the vendor profile associated with a given user."""
    return VendorProfile.objects.filter(user=user).first()

def get_active_vendors() -> QuerySet[VendorProfile]:
    """Returns a queryset of all approved and active vendor profiles."""
    return VendorProfile.objects.filter(is_approved=True)
