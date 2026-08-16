from django.contrib.auth.models import AbstractUser
from django.db import models
from common.models import UUIDModel, TimeStampedModel

class CustomUser(AbstractUser, UUIDModel, TimeStampedModel):
    class Role(models.TextChoices):
        BUYER = 'BUYER', 'Buyer'
        VENDOR = 'VENDOR', 'Vendor'
        ADMIN = 'ADMIN', 'Admin'
        
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.BUYER)

    def __str__(self):
        return self.username
