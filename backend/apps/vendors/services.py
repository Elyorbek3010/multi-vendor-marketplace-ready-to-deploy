from .models import VendorProfile

def create_vendor_profile(user, store_name: str, description: str = "") -> VendorProfile:
    """Creates a new vendor profile for a user, defaulting to unapproved status."""
    vendor = VendorProfile.objects.create(
        user=user,
        store_name=store_name,
        description=description,
        is_approved=False
    )
    return vendor

def update_vendor_profile(vendor: VendorProfile, **kwargs) -> VendorProfile:
    """Updates specific fields of an existing vendor profile dynamically."""
    for field, value in kwargs.items():
        setattr(vendor, field, value)
    vendor.save()
    return vendor
