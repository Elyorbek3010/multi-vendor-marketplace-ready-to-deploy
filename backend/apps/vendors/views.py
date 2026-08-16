from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import VendorProfile
from .serializers import VendorProfileSerializer
from . import services, selectors

class VendorProfileViewSet(viewsets.ModelViewSet):
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own profile, admins can see all
        user = self.request.user
        if user.role == 'ADMIN':
            return VendorProfile.objects.all()
        return VendorProfile.objects.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'VENDOR':
            user.role = 'VENDOR'
            user.save()
        services.create_vendor_profile(
            user=user,
            store_name=serializer.validated_data.get('store_name'),
            description=serializer.validated_data.get('description', '')
        )
