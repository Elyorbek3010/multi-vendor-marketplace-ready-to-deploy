import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from apps.orders.models import Order

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateStripeCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, buyer=request.user)
        
        if order.status != 'PENDING':
            return Response(
                {'error': 'You can only pay for pending orders.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'usd',
                            'unit_amount': int(order.total_amount * 100),
                            'product_data': {
                                'name': f'Order #{order.id}',
                            },
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=f"{settings.FRONTEND_URL}/orders?success=true",
                cancel_url=f"{settings.FRONTEND_URL}/orders?canceled=true",
                client_reference_id=str(order.id),
                metadata={
                    'order_id': str(order.id)
                }
            )
            return Response({'payment_link': checkout_session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            payload = request.body
            sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
            event = None

            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
            except ValueError as e:
                return HttpResponse(status=400)
            except stripe.error.SignatureVerificationError as e:
                return HttpResponse(status=400)

            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                order_id = getattr(session, 'client_reference_id', None)
                
                if order_id:
                    try:
                        from common.models import AuditLog
                        order = Order.objects.get(id=order_id)
                        order.status = 'PAID'
                        order.save()
                        
                        AuditLog.objects.create(
                            user=order.buyer,
                            action='ORDER_PAID_STRIPE',
                            details={'order_id': str(order.id), 'stripe_session_id': session.id}
                        )
                    except Order.DoesNotExist:
                        pass

            return HttpResponse(status=200)
        except Exception as e:
            return HttpResponse(f"Webhook Error: {str(e)}", status=500)
