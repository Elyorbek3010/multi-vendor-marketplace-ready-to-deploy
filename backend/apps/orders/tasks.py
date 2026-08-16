import time
from celery import shared_task

@shared_task
def generate_order_receipt_task(order_id):
    """
    Simulates generating a PDF receipt and sending an email notification.
    """
    print(f"[Celery] Starting receipt generation for Order {order_id}...")
    time.sleep(5)
    print(f"[Celery] Successfully generated receipt for Order {order_id}!")
    return f"Receipt sent for Order {order_id}"