from celery import shared_task
import time

@shared_task
def send_password_reset_email_task(email, reset_url):
    print(f"[Celery] Starting to send password reset email to {email}...")
    time.sleep(2)  # Simulate SMTP delay
    print(f"[Celery] Password reset email sent to {email}. URL: {reset_url}")
    return f"Reset email sent to {email}"
