import json
import redis
from django.conf import settings

def publish_realtime_notification(user_id: str, event_type: str, data: dict):
    redis_url = getattr(settings, 'CELERY_BROKER_URL', 'redis://redis:6379/0')
    r = redis.Redis.from_url(redis_url)
    
    payload = {
        "user_id": str(user_id),
        "type": event_type,
        "data": data
    }
    r.publish("user_notifications", json.dumps(payload))
