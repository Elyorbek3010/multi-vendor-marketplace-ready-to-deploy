# 🏪 Multi-Vendor Marketplace Platform

A robust, production-ready, full-stack multi-vendor marketplace platform built with modern technologies. This platform enables vendors to register, list products, manage inventory, and process orders, while buyers can seamlessly browse, add to cart, and securely checkout using Stripe.

---

## 🚀 Key Features

- **Multi-Vendor System:** Dedicated vendor dashboards for managing inventory, tracking revenue, and fulfilling orders.
- **Secure Authentication:** JWT-based role-based access control (Admin, Vendor, Buyer) to ensure users only access permitted resources.
- **Payment Processing:** Fully integrated with **Stripe Checkout** and Webhooks for secure payment processing and automated database status synchronization.
- **Real-Time Notifications:** WebSocket integration (powered by FastAPI & Redis) instantly notifies users when their order status changes.
- **Advanced Order Management:** Complete lifecycle handling (Pending, Paid, Shipped, Delivered, Cancelled, Refunded).
- **Inventory Protection:** Product stock is automatically deducted upon purchase and instantly restored if an order is cancelled or refunded.
- **Audit Logging:** Built-in `AuditLog` engine tracks critical state changes for administration and security monitoring.

---

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Axios (API Client)

**Backend:**
- Django & Django REST Framework (DRF)
- PostgreSQL (Primary Database)
- Stripe Python SDK

**Real-Time Service:**
- FastAPI
- WebSockets
- Redis

---

## 💻 Local Development Setup

To run this platform on your local machine, you will need **Python 3.10+**, **Node.js**, **PostgreSQL**, and **Redis**.

### 1. Database & Redis Setup
Ensure your PostgreSQL database is running and create a database for the project. Ensure your local Redis server is running on port `6379`.

### 2. Backend Setup (Django)
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 3. Real-Time Service Setup (FastAPI)
Open a new terminal:
```bash
cd realtime_service
python -m venv venv

# Activate venv as above
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Frontend Setup (React)
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables
You must create a `.env` (or `.env.prod` for production) in the `backend/` directory with the following keys:

```env
SECRET_KEY=your_django_secret
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/marketplace
REDIS_URL=redis://localhost:6379/0

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

---

## 🌍 Deployment

This repository is optimized for modern cloud deployments:
- **Frontend:** Configured to deploy seamlessly on **Vercel**. Just connect the GitHub repository and set the root directory to `frontend`.
- **Backend:** Configured with `Dockerfile.prod`, `start.sh`, and `build.sh` for easy deployment on **Render** (Web Services) or AWS.
- **Postgres & Redis:** Render natively supports managed Postgres and Redis instances. Ensure to link the internal Redis URL to the FastAPI environment variables.
