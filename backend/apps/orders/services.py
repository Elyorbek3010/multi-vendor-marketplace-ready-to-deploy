from .models import Order, OrderItem
from common.notifications import publish_realtime_notification
from rest_framework.exceptions import ValidationError
from django.db import transaction

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
    

    # Trigger Realtime Notification!
    publish_realtime_notification(
        str(buyer.id), 
        "ORDER_CREATED", 
        {"order_id": str(order.id), "status": order.status}
    )
    
    return order

def update_order_status(order: Order, new_status: str) -> Order:
    """Updates the status of an order and publishes a real-time notification to the buyer."""
    order.status = new_status
    order.save()
    publish_realtime_notification(
        str(order.buyer.id), 
        "ORDER_STATUS_UPDATED", 
        {"order_id": str(order.id), "status": order.status}
    )
    return order

@transaction.atomic
def cancel_order(order: Order, user) -> Order:
    """Cancels an order and restores product stock."""
    if order.status in [Order.Status.SHIPPED, Order.Status.DELIVERED]:
        raise ValidationError("Cannot cancel an order that has already been shipped or delivered.")
    if order.status == Order.Status.CANCELLED:
        raise ValidationError("Order is already cancelled.")
        
    # Check if a buyer is trying to cancel someone else's order
    if getattr(user, 'role', '') == 'BUYER' and order.buyer != user:
        raise ValidationError("You do not have permission to cancel this order.")

    # Restore stock for each item in the order
    for item in order.items.all():
        inventory = getattr(item.product, 'inventory', None)
        if inventory:
            inventory.stock += item.quantity
            inventory.save()

    # Update status
    order.status = Order.Status.CANCELLED
    order.save()

    # Notify buyer
    publish_realtime_notification(
        str(order.buyer.id), 
        "ORDER_CANCELLED", 
        {"order_id": str(order.id), "status": order.status}
    )
    
    return order
