from celery import Celery
import os

broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')
app = Celery('core', broker=broker_url)

@app.task
def dummy_task():
    return "Dummy"
