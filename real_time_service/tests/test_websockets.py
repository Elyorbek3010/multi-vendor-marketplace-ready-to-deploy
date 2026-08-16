import pytest
import jwt
import time
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
from main import app
from config import settings

client = TestClient(app)

def test_websocket_reject_invalid_token():
    with pytest.raises(WebSocketDisconnect) as excinfo:
        with client.websocket_connect("/ws/notifications/?token=invalid_token"):
            pass
    assert excinfo.value.code == 1008

def test_websocket_accept_valid_token():
    payload = {"user_id": "test_user_123", "exp": time.time() + 3600}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    with client.websocket_connect(f"/ws/notifications/?token={token}") as websocket:
        # Just connecting and then exiting context successfully means it accepted the connection
        assert True
