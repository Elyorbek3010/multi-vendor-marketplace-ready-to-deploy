import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from redis.asyncio import Redis
from manager import manager
from auth import verify_jwt_token
from config import settings
from fastapi.middleware.cors import CORSMiddleware

redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    async def redis_listener():
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("user_notifications")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    user_id = str(data.get("user_id"))
                    await manager.send_personal_message(data, user_id)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe("user_notifications")
            await pubsub.close()

    task = asyncio.create_task(redis_listener())
    yield
    task.cancel()
    if redis_client:
        await redis_client.aclose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "realtime"}

@app.websocket("/ws/notifications/")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = verify_jwt_token(token)
        user_id = str(payload.get("user_id"))
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
