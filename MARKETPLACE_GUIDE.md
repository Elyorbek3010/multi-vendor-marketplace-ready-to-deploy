# Marketplace Platform Guide

Welcome to the full-stack e-commerce marketplace monorepo! This guide explains the architecture, the Docker configuration, and how to manage your development environment.

## Architecture & Container Services

This project uses a microservices-inspired architecture designed for a modern e-commerce marketplace:

1. **db (PostgreSQL 15)**
   - **Why it exists:** Relational database for storing structured data such as user accounts, product catalogs, and order histories.
   - **Name:** `marketplace_db`

2. **redis (Redis 7)**
   - **Why it exists:** Serves a dual purpose as an in-memory caching layer to speed up queries, and as a message broker for Celery and real-time WebSocket events.

3. **backend (Django DRF)**
   - **Why it exists:** The core application logic and REST API. It handles user authentication, business rules, catalog management, and transactional processing.

4. **celery_worker (Celery)**
   - **Why it exists:** Handles background and long-running tasks asynchronously (e.g., sending emails, processing payments, image resizing) without blocking the main backend API.

5. **realtime (FastAPI)**
   - **Why it exists:** A specialized asynchronous service for handling high-throughput, low-latency WebSocket connections such as real-time notifications, live order tracking, or chat.

6. **frontend (React)**
   - **Why it exists:** The user-facing web application that consumers will interact with, built as a Single Page Application (SPA).

---

## Configuration Breakdown

### Ports
Ports define how you access the services from your host machine (`host_port:container_port`):
- `5432:5432`: PostgreSQL database port.
- `6379:6379`: Redis cache and broker port.
- `8000:8000`: Django backend API.
- `8001:8001`: FastAPI real-time service.
- `3000:3000`: React frontend.

### Volumes
Volumes persist data and sync files between your machine and the containers:
- `postgres_data:/var/lib/postgresql/data`: A named volume that ensures your database data isn't lost when the container stops.
- `./backend:/app` (etc.): Bind mounts that link your local source code directories into the container. When you edit a file locally, the container sees the change immediately.
- `/app/node_modules`: An anonymous volume in the frontend to prevent your local `node_modules` from overwriting the container's isolated node environment.

### Environment Variables
Environment variables configure the services dynamically:
- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`: Initializes the PostgreSQL database with default credentials.
- `DATABASE_URL`: The connection string the backend uses to connect to PostgreSQL.
- `REDIS_URL` / `CELERY_BROKER_URL`: Tells the backend and Celery where to find Redis for caching and message queuing.

---

## Docker Compose Commands

### Building and Starting the Environment

To build the images and start all containers in the background (detached mode):
```bash
docker-compose up -d --build
```

If you want to view the logs output live in your terminal, omit the `-d`:
```bash
docker-compose up --build
```

### Stopping the Environment

To stop and remove the containers, networks, and images created by `up`:
```bash
docker-compose down
```

*Note: This command preserves your database data because the `postgres_data` volume is external to the container lifecycle.*

### Viewing Logs

To see the logs for all services:
```bash
docker-compose logs -f
```

To see logs for a specific service (e.g., the backend):
```bash
docker-compose logs -f backend
```

### Completely Resetting (Including Database)

If you need to start completely fresh and wipe your database data:
```bash
docker-compose down -v
```
*(The `-v` flag removes named volumes, destroying your local database state.)*

---

## Step 2: Authentication & Database Models

### JWT Authentication Flow
JSON Web Token (JWT) authentication provides a stateless and scalable way to handle user sessions. 
- When a client logs in with valid credentials, the server responds with two tokens: an **Access Token** and a **Refresh Token**.
- The **Access Token** is short-lived (e.g., 60 minutes) and is sent in the `Authorization: Bearer <token>` header of every API request to prove identity.
- When the Access Token expires, the client uses the longer-lived **Refresh Token** against the `/api/auth/refresh/` endpoint to get a new Access Token without asking the user to log in again.

### Custom User Models in Django
We use a Custom User model (`authentication.CustomUser`) in this project because:
1. **Extensibility**: It allows us to add custom fields (like `role` or a UUID primary key) easily right from the beginning. Doing this later in a project is extremely difficult.
2. **Role Management**: Our model defines `BUYER`, `VENDOR`, and `ADMIN` roles natively, enabling us to restrict permissions (e.g., only VENDORs can create products).
3. **Consistency**: It integrates with our abstract `UUIDModel` and `TimeStampedModel` to ensure every user has a UUID primary key and automatic created/updated timestamps.

### Testing Authentication Endpoints
You can test the authentication endpoints using cURL or Postman. Assuming the backend is running on `http://localhost:8000`:

#### 1. Login (Obtain Tokens)
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "password123"}'
```
*Expected response: A JSON object containing `access` and `refresh` tokens.*

#### 2. Refresh Token
```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
     -H "Content-Type: application/json" \
     -d '{"refresh": "<your_refresh_token_here>"}'
```
*Expected response: A JSON object containing a new `access` token.*
