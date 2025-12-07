"""
Security utilities for OTP generation and token management.
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.config import get_settings

settings = get_settings()


def generate_otp(length: Optional[int] = None) -> str:
    """
    Generate a cryptographically secure OTP.
    
    Args:
        length: Length of OTP (defaults to settings.OTP_LENGTH)
    
    Returns:
        A string of random digits with the specified length
    """
    if length is None:
        length = settings.OTP_LENGTH
    
    # Generate random number and format as zero-padded string
    max_value = 10 ** length - 1
    random_number = secrets.randbelow(max_value + 1)
    return f"{random_number:0{length}d}"


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing the data to encode in the token (e.g., {"sub": email, "name": name})
        expires_delta: Optional timedelta for token expiration (defaults to settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    Returns:
        A JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_access_token() -> str:
    """
    Generate a secure access token (deprecated - use create_access_token instead).
    
    This is kept for backward compatibility but should be replaced with create_access_token.
    
    Returns:
        A secure random token string
    """
    return secrets.token_urlsafe(32)


def validate_phone_number(country_code: str, mobile_number: str) -> bool:
    """
    Validate phone number format.
    
    Args:
        country_code: Country code (e.g., +1, +91)
        mobile_number: Mobile number without country code
    
    Returns:
        True if valid, False otherwise
    """
    # Basic validation
    if not country_code.startswith("+"):
        return False
    
    if not mobile_number.isdigit():
        return False
    
    # Minimum length check (adjust based on requirements)
    if len(mobile_number) < 10:
        return False
    
    return True

