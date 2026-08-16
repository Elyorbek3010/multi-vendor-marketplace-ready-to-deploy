from rest_framework import serializers
from .models import VendorProfile

class VendorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorProfile
        fields = ['id', 'store_name', 'description', 'is_approved', 'created_at']
        read_only_fields = ['id', 'is_approved', 'created_at']
