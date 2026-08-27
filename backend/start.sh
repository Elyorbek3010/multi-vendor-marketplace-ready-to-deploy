#!/usr/bin/env bash
set -o errexit

cd backend

# Start Gunicorn server in the foreground
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
