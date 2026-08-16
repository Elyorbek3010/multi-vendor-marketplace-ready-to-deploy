from .models import Order, OrderItem
from .tasks import generate_order_receipt_task
from common.notifications import publish_realtime_notification

def create_order(buyer, items_data: list) -> Order:
    """
    Creates an order, adds order items, calculates total, and triggers background email task.
    """
    order = Order.objects.create(buyer=buyer)
    total = 0
    
    for item in items_data:
        product = item['product']
        quantity = item['quantity']
        price = product.price
        
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            price_at_purchase=price
        )
        total += (price * quantity)
    
    order.total_amount = total
    order.save()
    
    # Trigger Celery Background Task!
    generate_order_receipt_task.delay(str(order.id))
    
    # Trigger Realtime Notification!
    publish_realtime_notification(
        str(buyer.id), 
        "ORDER_CREATED", 
        {"order_id": str(order.id), "status": order.status}
    )
    
    return order

def update_order_status(order: Order, new_status: str) -> Order:
    order.status = new_status
    order.save()
    publish_realtime_notification(
        str(order.buyer.id), 
        "ORDER_STATUS_UPDATED", 
        {"order_id": str(order.id), "status": order.status}
    )
    return order
