"""
WSGI config for the Marketplace Platform project.
"""

import os
from django.core.wsgi import get_wsgi_application

# Point to your settings module (e.g. config.settings or config.settings.base)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

application = get_wsgi_application()