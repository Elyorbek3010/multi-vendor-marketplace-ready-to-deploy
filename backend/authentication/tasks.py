from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_password_reset_email_task(email, reset_url):
    logger.info(f"Starting to send password reset email to {email}...")
    
    subject = "Password Reset Request - Marketplace"
    message = f"Hello,\n\nYou have requested a password reset for your Marketplace account.\n\nPlease click the link below to reset your password:\n{reset_url}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Marketplace Team"
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"Password reset email successfully sent to {email}.")
        return f"Reset email sent to {email}"
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        raise e
