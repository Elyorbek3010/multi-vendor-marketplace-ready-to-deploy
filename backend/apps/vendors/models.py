from django.db import models
from django.conf import settings
from common.models import UUIDModel, TimeStampedModel
from django.db.models.signals import post_save
from django.dispatch import receiver

class VendorProfile(UUIDModel, TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    store_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.store_name

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_vendor_profile(sender, instance, created, **kwargs):
    if created and getattr(instance, 'role', '').upper() == 'VENDOR':
        VendorProfile.objects.create(
            user=instance,
            store_name=f"{instance.username}'s Store"
        )
