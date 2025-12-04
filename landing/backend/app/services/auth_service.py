"""
Authentication service for handling user authentication.
"""
import logging
from typing import Optional
from app.services.otp_service import get_otp_service
from app.services.email_service import get_email_service
from app.core.security import create_access_token
from app.core.exceptions import ValidationError
from app.utils.validators import validate_email, validate_otp
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self):
        self.otp_service = get_otp_service()
        self.email_service = get_email_service()
    
    def send_email_otp(self, email: str, name: Optional[str] = None) -> dict:
        """
        Send OTP to the provided email address.
        
        Args:
            email: Email address
            name: Optional user name
        
        Returns:
            Dictionary with success status and message
        
        Raises:
            ValidationError: If input validation fails
            SMSException: If email sending fails
        """
        # Validate inputs
        validate_email(email)
        
        # Generate and store OTP (using email as identifier)
        otp = self.otp_service.generate_and_store_otp("", email)  # Empty country code for email
        
        # Send OTP via email (for login, no name provided)
        try:
            self.email_service.send_otp(email, otp, name, is_signup=False)
        except Exception as e:
            # If email fails, clean up OTP
            self.otp_service.delete_otp("", email)
            raise
        
        logger.info(f"OTP sent successfully to {email}")
        
        return {
            "success": True,
            "message": "Verification code sent successfully",
            "expires_in": settings.OTP_EXPIRY_SECONDS
        }
    
    def verify_email_otp(self, email: str, otp: str) -> dict:
        """
        Verify OTP and generate JWT access token.
        
        Args:
            email: Email address
            otp: OTP provided by user
        
        Returns:
            Dictionary with success status, message, and JWT access token
        
        Raises:
            ValidationError: If input validation fails
            OTPException: If OTP verification fails
        """
        # Validate inputs
        validate_email(email)
        validate_otp(otp, expected_length=settings.OTP_LENGTH)
        
        # Verify OTP
        self.otp_service.verify_otp("", email, otp)  # Empty country code for email
        
        # Create JWT token with user data
        token_data = {
            "sub": email,  # Subject (user identifier)
            "email": email
        }
        
        access_token = create_access_token(data=token_data)
        
        # TODO: Create/update user in database
        # TODO: Store user information
        # TODO: Return user information along with token
        
        logger.info(f"OTP verified successfully for {email}, JWT token generated")
        
        return {
            "success": True,
            "message": "OTP verified successfully",
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    def signup_with_email_otp(self, name: str, email: str) -> dict:
        """
        Signup user and send OTP for email verification.
        
        Args:
            name: User's name
            email: Email address
        
        Returns:
            Dictionary with success status and message
        
        Raises:
            ValidationError: If input validation fails
            SMSException: If email sending fails
        """
        # Validate inputs
        if not name or not name.strip():
            raise ValidationError("Name is required")
        validate_email(email)
        
        # Generate and store OTP
        otp = self.otp_service.generate_and_store_otp("", email)
        
        # Send OTP via email (for signup, with name)
        try:
            self.email_service.send_otp(email, otp, name.strip(), is_signup=True)
        except Exception as e:
            # If email fails, clean up OTP
            self.otp_service.delete_otp("", email)
            raise
        
        logger.info(f"Signup OTP sent successfully to {email}")
        
        return {
            "success": True,
            "message": "Verification code sent successfully",
            "expires_in": settings.OTP_EXPIRY_SECONDS
        }
    
    def verify_signup_otp(self, name: str, email: str, otp: str) -> dict:
        """
        Verify signup OTP and create user account.
        
        Args:
            name: User's name
            email: Email address
            otp: OTP provided by user
        
        Returns:
            Dictionary with success status, message, and JWT access token
        
        Raises:
            ValidationError: If input validation fails
            OTPException: If OTP verification fails
        """
        # Validate inputs
        if not name or not name.strip():
            raise ValidationError("Name is required")
        validate_email(email)
        validate_otp(otp, expected_length=settings.OTP_LENGTH)
        
        # Verify OTP
        self.otp_service.verify_otp("", email, otp)
        
        # Create JWT token with user data
        token_data = {
            "sub": email,  # Subject (user identifier)
            "email": email,
            "name": name.strip()
        }
        
        access_token = create_access_token(data=token_data)
        
        # TODO: Create user in database with name and email
        # TODO: Store user information
        # TODO: Return user information along with token
        
        logger.info(f"Signup verified successfully for {email} (name: {name}), JWT token generated")
        
        return {
            "success": True,
            "message": "Account created successfully",
            "access_token": access_token,
            "token_type": "bearer"
        }


# Singleton instance
_auth_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """Get auth service singleton instance."""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service

