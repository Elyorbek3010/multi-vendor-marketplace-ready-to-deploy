from celery import shared_task
from django.conf import settings
import logging
import urllib.request
import urllib.error
import json
import os

logger = logging.getLogger(__name__)

@shared_task
def send_password_reset_email_task(email, reset_url):
    logger.info(f"Starting to send password reset email to {email} using Resend...")
    
    resend_api_key = os.environ.get('RESEND_API_KEY')
    if not resend_api_key:
        logger.error("RESEND_API_KEY is missing from environment variables.")
        raise ValueError("RESEND_API_KEY is not set.")

    # Using Resend's default testing email. Note: You must verify your domain on Resend to change this.
    sender = "onboarding@resend.dev"
    subject = "Password Reset Request - Marketplace"
    html_content = f"""
    <p>Hello,</p>
    <p>You have requested a password reset for your Marketplace account.</p>
    <p>Please click the link below to reset your password:</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thanks,<br>The Marketplace Team</p>
    """

    data = json.dumps({
        "from": sender,
        "to": [email],
        "subject": subject,
        "html": html_content
    }).encode('utf-8')

    req = urllib.request.Request("https://api.resend.com/emails", data=data)
    req.add_header("Authorization", f"Bearer {resend_api_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read()
            logger.info(f"Password reset email successfully sent to {email}. Resend API Response: {res_data}")
            return f"Reset email sent to {email}"
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        logger.error(f"Resend API HTTPError: {e.code} - {error_msg}")
        raise e
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        raise e
