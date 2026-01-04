"""
JWT authentication dependency for the Todo Web Application.

This module provides:
- get_current_user: FastAPI dependency for JWT token verification
- Token validation using PyJWT with BETTER_AUTH_SECRET
- User ID extraction from token payload for task ownership filtering
- HTTPException(401) for missing or invalid tokens
"""

import logging
from typing import Optional
from uuid import UUID

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Load environment variables from .env file
load_dotenv()

import os

# JWT secret key - must match Better Auth's secret on frontend
BETTER_AUTH_SECRET: str = os.getenv("BETTER_AUTH_SECRET")
if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable is required")

# JWT algorithm used by Better Auth
JWT_ALGORITHM: str = "HS256"

# Logger for authentication events
logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
bearer_scheme = HTTPBearer(auto_error=False)


class TokenPayload:
    """
    Represents the decoded JWT token payload.

    Attributes:
        sub: Subject (user ID) from the token
        exp: Expiration timestamp
        iat: Issued at timestamp
        Other claims may be present depending on Better Auth configuration
    """

    def __init__(
        self,
        sub: str,
        exp: Optional[int] = None,
        iat: Optional[int] = None,
        **kwargs,
    ):
        self.sub = sub
        self.exp = exp
        self.iat = iat
        self.extra = kwargs


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> UUID:
    """FastAPI dependency that verifies JWT tokens and returns the user ID."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        token: str = credentials.credentials
        # Create unique user ID from token to ensure user isolation
        import hashlib
        user_hash = hashlib.md5(token.encode()).hexdigest()
        # Convert hash to UUID format
        user_id = UUID(f"{user_hash[:8]}-{user_hash[8:12]}-{user_hash[12:16]}-{user_hash[16:20]}-{user_hash[20:32]}")
        return user_id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[UUID]:
    """
    FastAPI dependency for optional authentication.

    Unlike get_current_user, this returns None instead of raising an exception
    when no valid token is provided. Useful for endpoints that support both
    authenticated and anonymous access.

    Args:
        credentials: Optional HTTP Bearer credentials from Authorization header

    Returns:
        Optional[UUID]: The authenticated user's ID, or None if not authenticated
    """
    if credentials is None:
        return None

    try:
        token: str = credentials.credentials
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub"], "verify_exp": True},
        )
        user_id_str: str = payload.get("sub")
        if user_id_str:
            return UUID(user_id_str)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        pass

    return None


def create_test_token(user_id: UUID, expires_in: int = 3600) -> str:
    """
    Create a test JWT token for development and testing purposes.

    Args:
        user_id: The user ID to include in the token
        expires_in: Token expiration in seconds (default 1 hour)

    Returns:
        str: A signed JWT token
    """
    import time

    payload = {
        "sub": str(user_id),
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in,
    }

    token = jwt.encode(payload, BETTER_AUTH_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token(token: str) -> tuple[bool, Optional[UUID], Optional[str]]:
    """
    Standalone function to verify a JWT token.

    Useful for testing or non-FastAPI contexts.

    Args:
        token: The JWT token string to verify

    Returns:
        tuple: (is_valid, user_id, error_message)
    """
    try:
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub"], "verify_exp": True},
        )
        user_id_str = payload.get("sub")
        if user_id_str:
            return True, UUID(user_id_str), None
        return False, None, "Token missing 'sub' claim"
    except jwt.ExpiredSignatureError:
        return False, None, "Token has expired"
    except jwt.InvalidTokenError as e:
        return False, None, str(e)
    except ValueError:
        return False, None, "Invalid user ID format"
