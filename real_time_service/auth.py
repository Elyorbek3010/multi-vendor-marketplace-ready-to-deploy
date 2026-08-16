import jwt
from config import settings
from fastapi import WebSocketException, status

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Token has expired")
    except jwt.InvalidTokenError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
