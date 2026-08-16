import pytest
import jwt
import time
from fastapi import WebSocketException
from auth import verify_jwt_token
from config import settings

def test_verify_jwt_token_valid():
    payload = {"user_id": 1, "exp": time.time() + 3600}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    decoded = verify_jwt_token(token)
    assert decoded["user_id"] == 1

def test_verify_jwt_token_expired():
    payload = {"user_id": 1, "exp": time.time() - 3600}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(WebSocketException) as excinfo:
        verify_jwt_token(token)
    assert excinfo.value.code == 1008
    assert excinfo.value.reason == "Token has expired"

def test_verify_jwt_token_invalid_secret():
    payload = {"user_id": 1, "exp": time.time() + 3600}
    token = jwt.encode(payload, "wrong_secret", algorithm=settings.ALGORITHM)
    with pytest.raises(WebSocketException) as excinfo:
        verify_jwt_token(token)
    assert excinfo.value.code == 1008
    assert excinfo.value.reason == "Invalid token"
