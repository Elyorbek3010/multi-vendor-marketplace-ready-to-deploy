# 03 Celery & Background Tasks

This document explains our asynchronous job processing architecture using Celery and Redis.

## 1. What are a Task Queue and a Message Broker?

In a robust web architecture, your main web server (like Django) should only handle fast operations (reading/writing small data to the DB) and immediately return an HTTP response. 
However, applications often need to do "heavy lifting", such as:
- Generating a PDF invoice.
- Sending an email.
- Resizing an uploaded image.
- Processing a credit card transaction.

Doing this in the main web thread blocks the server from handling other users. Enter the **Task Queue**.

- **Message Broker (Redis)**: Think of this as a post office. When Django needs an email sent, it drops a "message" off at Redis saying "Send receipt for Order #123". Django then immediately responds to the user saying "Your order is placed!"
- **Task Queue (Celery Worker)**: Think of this as the mail carrier. A separate container (`celery_worker` in our `docker-compose.yml`) is constantly listening to Redis. When it sees the "Send receipt" message, the Celery worker picks it up and processes the heavy PDF/email logic in the background, without bothering the Django server.

## 2. The Setup in this Project

1. **`backend/config/celery.py`**: Initializes the Celery application and binds it to our Django settings.
2. **Settings**: We added `CELERY_BROKER_URL = 'redis://redis:6379/0'` to `base.py` to point Celery to our Redis container.
3. **`apps/orders/tasks.py`**: Contains our `@shared_task` decorated functions (like `generate_order_receipt_task`).
4. **Triggering**: In our Order Service (`apps/orders/services.py`), after saving an order to the database, we call `generate_order_receipt_task.delay(order.id)`. The `.delay()` method is Celery magic that pushes the job to Redis instead of running it immediately.

## 3. Inspecting Running Tasks

Because Celery runs in a completely separate Docker container, you won't see its `print()` statements in the standard Django API logs. 

To watch the Celery worker process jobs in real-time, you can view the logs for the `celery_worker` service:

```bash
# View the live logs for the celery worker
docker-compose logs -f celery_worker
```

When you trigger an order in the API, you will see output like this in the Celery logs:
```
[Celery] Starting receipt generation for Order 5a9b...
[Celery] Successfully generated receipt and sent email for Order 5a9b!
```
