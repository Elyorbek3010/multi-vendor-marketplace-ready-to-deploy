from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    vendor_id = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'vendor_id', 'store_name']
        read_only_fields = ['id', 'email', 'role', 'vendor_id', 'store_name']

    def get_vendor_id(self, obj):
        vendor = getattr(obj, 'vendor_profile', None)
        return str(vendor.id) if vendor else None

    def get_store_name(self, obj):
        vendor = getattr(obj, 'vendor_profile', None)
        return vendor.store_name if vendor else None

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role']
        read_only_fields = ['id']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        role = validated_data.get('role', 'BUYER')
        email = validated_data['email']
        username = email.split('@')[0]
        
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password'],
            role=role
        )
        return user

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.EmailField(required=True)
        if 'username' in self.fields:
            del self.fields['username']

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = User.objects.filter(email__iexact=email).first()
        
        if user and user.check_password(password):
            self.user = user
        else:
            raise serializers.ValidationError({'detail': 'No active account found with the given credentials'})

        if not self.user.is_active:
            raise serializers.ValidationError({'detail': 'This account is inactive.'})

        refresh = self.get_token(self.user)

        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        return data

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data.get('uidb64')))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid token or user.")
            
        if not default_token_generator.check_token(user, data.get('token')):
            raise serializers.ValidationError("Invalid or expired token.")
            
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value
