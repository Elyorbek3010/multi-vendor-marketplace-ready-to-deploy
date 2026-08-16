# AI Architecture & Deployment Guide: Marketplace Platform

## Overview
This document serves as a comprehensive architectural map of the Multi-Vendor E-Commerce Marketplace platform. It is specifically written to provide context to any AI assistant (such as Gemini) so they can seamlessly assist with production deployment, scaling, or feature additions.

---

## 1. Technology Stack
The platform is a decoupled full-stack application running entirely within Docker containers.
* **Frontend:** React 18, Vite, React Router, TailwindCSS (with full Dark Mode support).
* **Backend API:** Django 5.x, Django REST Framework (DRF), SimpleJWT (for authentication).
* **Real-time Service:** FastAPI (handles WebSockets for instant notifications).
* **Database:** PostgreSQL.
* **Caching & Message Broker:** Redis.
* **Background Tasks:** Celery (handles asynchronous tasks like receipt generation).
* **Orchestration:** Docker & Docker Compose.

---

## 2. Docker Architecture & Services
The application is orchestrated via a `docker-compose.yml` file which links the following services via a shared Docker network (`marketplace_network`):

* `db` (Postgres 15): Persists the relational data.
* `redis` (Redis 7): Serves as the Celery broker, Celery result backend, and real-time message bus.
* `backend` (Django): Runs on port `8000`. Connects to `db` and `redis`.
* `celery` (Celery Worker): Runs background tasks defined in the Django apps.
* `real_time_service` (FastAPI): Runs on port `8001`. Connects to Redis to listen for broadcast events and pushes them to the frontend via WebSockets.
* `frontend` (Vite dev server): Runs on port `3000`. Proxies API requests to the backend.

---

## 3. Backend Application Structure
The Django backend (`backend/` directory) uses a domain-driven design, split into multiple independent apps.

### Core Apps & Models:
* **`authentication`**: Custom User model extending AbstractUser. Uses JWT for auth. Role-based access (BUYER vs VENDOR).
* **`vendors`**: `VendorProfile` model linked 1-to-1 with Users.
* **`products`**:
    * `Category`: Hierarchical product categories.
    * `Product`: Contains JSON options (variants), price, vendor FK, soft-deletion (`is_active`).
    * `ProductImage`: Multiple images per product.
    * `Inventory`: Stock tracking.
    * `Review`: 5-star ratings and text reviews (restricted to buyers with a 'DELIVERED' order).
* **`orders`**:
    * `Cart` & `CartItem`: Persistent server-side cart.
    * `Order` & `OrderItem`: Immutable order history. Order states: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
    * Celery Tasks: Async receipt generation triggered post-order.

### API Rules & Security:
* **Pagination:** Global `PageNumberPagination` is active. API responses return `{ count, next, previous, results: [...] }`.
* **CORS:** Configured to allow requests from the frontend origin.
* **Integrity:** Products have `on_delete=models.PROTECT` against orders to prevent destroying historical receipt data. Deleting a product triggers a "Soft Delete" (`is_active=False`) rather than a hard DB delete.

---

## 4. Frontend Application Structure
The React frontend (`frontend/` directory) manages state locally and communicates via an Axios interceptor setup that automatically attaches JWT bearer tokens.

### Key Context Providers (`src/context/`):
* `AuthContext`: Manages login, registration, JWT lifecycle, and user roles.
* `CartContext`: Syncs local cart state with the backend API.
* `ThemeContext`: Toggles global light/dark mode based on `localStorage` or OS preference.

### Key Pages (`src/pages/`):
* **`ProductCatalog`**: Main landing page displaying all active products. Uses paginated API endpoints.
* **`ProductDetail`**: Complex page for viewing a product, selecting variants (from JSON options), viewing/submitting reviews, and adding to the cart. Full dark mode support.
* **`VendorDashboard`**: Restricted to VENDOR roles. Handles CRUD for products (with FormData for image uploads) and displays incoming orders. Vendors can update order statuses here.

---

## 5. Deployment Status & Missing Pieces
The code is functionally complete for a "Development Environment." To achieve a "Production Deployment," the following infrastructural steps must be completed:

### A. Production Web Servers
Currently, Django uses `manage.py runserver` and React uses `vite dev`.
* **Action Required:** Create a `docker-compose.prod.yml`.
* **Action Required:** Serve the Django WSGI application using **Gunicorn**.
* **Action Required:** Build the React frontend (`npm run build`) and serve the static files using **Nginx**. Nginx should also act as a reverse proxy, forwarding `/api` to Gunicorn and `/ws` to FastAPI.

### B. Static & Media File Management
Uploaded product images currently save inside the ephemeral Docker container file system.
* **Action Required:** Configure Django to use `django-storages` and push uploaded media to a cloud object storage service (like AWS S3, Cloudflare R2, or DigitalOcean Spaces).
* **Action Required:** Run `python manage.py collectstatic` to gather admin panel assets and serve them via Nginx or CDN.

### C. SSL & Domain Configuration
* **Action Required:** Provision a Linux VPS (Ubuntu).
* **Action Required:** Point a domain name to the VPS IP.
* **Action Required:** Use Let's Encrypt (Certbot) to secure Nginx with an HTTPS certificate.
* **Action Required:** Ensure `.env` contains `DEBUG=False` and a secure `SECRET_KEY`.

### D. Payment Gateway (Future Implementation)
The cart currently mocks checkout by immediately generating an order in the database.
* **Action Required:** Integrate Stripe Checkout or Stripe Connect on the frontend to authorize credit cards before the backend finalizes the `Order` creation.

---

## How to Help the User Next
If the user asks for deployment help, your immediate priority should be:
1. Writing the `nginx.conf` file to serve the frontend and proxy the backend APIs.
2. Writing the `docker-compose.prod.yml` file to implement Nginx and Gunicorn.
3. Providing instructions on securing the `.env` file for production.
