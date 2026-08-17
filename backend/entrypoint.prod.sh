#!/bin/sh

echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL is up and running."

# Run migrations and collect static files automatically on launch
python manage.py migrate --no-input
python manage.py collectstatic --no-input

exec "$@"