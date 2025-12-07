"""
OTP storage model.
In production, this would be replaced with a database model.
"""
import time
from typing import Optional
from dataclasses import dataclass, field
from app.config import get_settings

settings = get_settings()


@dataclass
class OTPRecord:
    """
    Represents an OTP record in storage.
    
    Attributes:
        otp: The generated OTP code
        created_at: Timestamp when OTP was created
        expires_at: Timestamp when OTP expires
        attempts: Number of verification attempts made
        phone_number: Full phone number (country_code + mobile_number)
    """
    otp: str
    phone_number: str
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(init=False)
    attempts: int = 0
    
    def __post_init__(self):
        """Set expiration time after initialization."""
        self.expires_at = self.created_at + settings.OTP_EXPIRY_SECONDS
    
    def is_expired(self) -> bool:
        """Check if OTP has expired."""
        return time.time() > self.expires_at
    
    def increment_attempts(self) -> None:
        """Increment verification attempts."""
        self.attempts += 1
    
    def has_exceeded_max_attempts(self) -> bool:
        """Check if maximum attempts have been exceeded."""
        return self.attempts >= settings.OTP_MAX_ATTEMPTS
    
    def get_remaining_attempts(self) -> int:
        """Get remaining verification attempts."""
        return max(0, settings.OTP_MAX_ATTEMPTS - self.attempts)




