from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        email = kwargs.get('email') or username
        if not email:
            return None
        
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
            
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
            
        return None
