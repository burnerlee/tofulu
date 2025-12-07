"""
OTP service for managing OTP generation, storage, and verification.
In production, this should use Redis or a database.
"""
import logging
from typing import Dict, Optional
from app.models.otp import OTPRecord
from app.core.security import generate_otp
from app.core.exceptions import (
    OTPNotFoundError,
    OTPExpiredError,
    OTPInvalidError,
    OTPMaxAttemptsExceededError
)
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OTPService:
    """
    Service for managing OTP operations.
    
    Note: Uses in-memory storage for development.
    In production, replace with Redis or database.
    """
    
    def __init__(self):
        # In-memory storage (replace with Redis in production)
        self._storage: Dict[str, OTPRecord] = {}
    
    def generate_and_store_otp(self, country_code: str, identifier: str) -> str:
        """
        Generate and store an OTP for the given identifier (email or phone).
        
        Args:
            country_code: Country code (e.g., +1, +91) or empty string for email
            identifier: Email address or mobile number
        
        Returns:
            The generated OTP
        """
        # Use email or phone number as key
        if country_code:
            key = f"{country_code}{identifier}"
        else:
            key = identifier  # Email address
        
        otp = generate_otp()
        
        # Store OTP record
        otp_record = OTPRecord(otp=otp, phone_number=key)
        self._storage[key] = otp_record
        
        logger.info(f"OTP generated for {key} (expires in {settings.OTP_EXPIRY_SECONDS}s)")
        
        return otp
    
    def get_otp_record(self, country_code: str, identifier: str) -> OTPRecord:
        """
        Get OTP record for the given identifier (email or phone).
        
        Args:
            country_code: Country code (e.g., +1, +91) or empty string for email
            identifier: Email address or mobile number
        
        Returns:
            OTPRecord instance
        
        Raises:
            OTPNotFoundError: If OTP not found
            OTPExpiredError: If OTP has expired
        """
        # Use email or phone number as key
        if country_code:
            key = f"{country_code}{identifier}"
        else:
            key = identifier  # Email address
        
        if key not in self._storage:
            raise OTPNotFoundError()
        
        otp_record = self._storage[key]
        
        if otp_record.is_expired():
            # Clean up expired OTP
            del self._storage[key]
            raise OTPExpiredError()
        
        return otp_record
    
    def verify_otp(
        self, 
        country_code: str, 
        identifier: str, 
        provided_otp: str
    ) -> bool:
        """
        Verify the provided OTP.
        
        Args:
            country_code: Country code (e.g., +1, +91) or empty string for email
            identifier: Email address or mobile number
            provided_otp: OTP provided by user
        
        Returns:
            True if OTP is valid
        
        Raises:
            OTPNotFoundError: If OTP not found
            OTPExpiredError: If OTP has expired
            OTPMaxAttemptsExceededError: If max attempts exceeded
            OTPInvalidError: If OTP is invalid
        """
        # Use email or phone number as key
        if country_code:
            key = f"{country_code}{identifier}"
        else:
            key = identifier  # Email address
        
        otp_record = self.get_otp_record(country_code, identifier)
        
        # Check if max attempts exceeded
        if otp_record.has_exceeded_max_attempts():
            del self._storage[key]
            raise OTPMaxAttemptsExceededError()
        
        # Verify OTP
        if provided_otp != otp_record.otp:
            otp_record.increment_attempts()
            remaining = otp_record.get_remaining_attempts()
            raise OTPInvalidError(attempts_remaining=remaining)
        
        # OTP is valid - clean up
        del self._storage[key]
        logger.info(f"OTP verified successfully for {key}")
        
        return True
    
    def delete_otp(self, country_code: str, identifier: str) -> None:
        """
        Delete OTP record (cleanup).
        
        Args:
            country_code: Country code (e.g., +1, +91) or empty string for email
            identifier: Email address or mobile number
        """
        # Use email or phone number as key
        if country_code:
            key = f"{country_code}{identifier}"
        else:
            key = identifier  # Email address
        
        if key in self._storage:
            del self._storage[key]
            logger.info(f"OTP deleted for {key}")
    
    def cleanup_expired_otps(self) -> int:
        """
        Clean up expired OTPs from storage.
        
        Returns:
            Number of expired OTPs removed
        """
        expired_numbers = [
            phone_number
            for phone_number, record in self._storage.items()
            if record.is_expired()
        ]
        
        for phone_number in expired_numbers:
            del self._storage[phone_number]
        
        if expired_numbers:
            logger.info(f"Cleaned up {len(expired_numbers)} expired OTPs")
        
        return len(expired_numbers)


# Singleton instance
_otp_service: Optional[OTPService] = None


def get_otp_service() -> OTPService:
    """Get OTP service singleton instance."""
    global _otp_service
    if _otp_service is None:
        _otp_service = OTPService()
    return _otp_service

