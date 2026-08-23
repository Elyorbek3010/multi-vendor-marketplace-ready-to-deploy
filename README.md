# Multi-Vendor Marketplace Platform

A complete, full-stack multi-vendor marketplace platform ready for deployment.

## Features

- **Frontend**: React-based responsive UI for both customers and vendors.
- **Backend**: Django REST Framework API for data management (users, products, orders).
- **Real-Time Services**: FastAPI backend combined with Redis for real-time WebSocket notifications (e.g., order status updates).
- **Authentication**: Secure JWT-based authentication shared between Django and FastAPI services.
- **Database**: PostgreSQL for persistent data storage.

## Project Structure

- `/backend`: Contains the Django application (handling business logic, API endpoints, and database interactions).
- `/frontend`: Contains the React application (customer storefront and vendor dashboard).
- `/realtime_service`: Contains the FastAPI application (handling WebSockets and real-time features).

## Getting Started

1. Clone the repository.
2. Ensure you have Node.js, Python, PostgreSQL, and Redis installed.
3. Configure the environment variables (see `.env.example`).
4. Run the backend Django server, the FastAPI real-time service, and the React frontend development server.

## Deployment

This platform is configured for deployment with Vercel (Frontend) and Render (Backend).
