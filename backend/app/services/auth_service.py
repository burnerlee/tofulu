"""
Authentication service for handling user authentication.
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.services.otp_service import get_otp_service
from app.services.email_service import get_email_service
from app.core.security import create_access_token
from app.core.exceptions import ValidationError, UserNotFoundError, SMSException
from app.utils.validators import validate_email, validate_otp
from app.config import get_settings
from app.models.user import User
from app.database import get_db

logger = logging.getLogger(__name__)
settings = get_settings()


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self):
        self.otp_service = get_otp_service()
        self.email_service = get_email_service()
    
    def send_email_otp(self, email: str, name: Optional[str] = None, db: Session = None) -> dict:
        """
        Send OTP to the provided email address.
        For login, checks if user exists before sending OTP.
        
        Args:
            email: Email address
            name: Optional user name (for signup)
            db: Database session (required for login to check user existence)
        
        Returns:
            Dictionary with success status and message
        
        Raises:
            ValidationError: If input validation fails
            UserNotFoundError: If user does not exist (for login)
            SMSException: If email sending fails
        """
        # Validate inputs
        validate_email(email)
        
        # For login (no name provided), check if user exists first
        if name is None and db is not None:
            user = db.query(User).filter(User.email == email.lower().strip()).first()
            if not user:
                raise UserNotFoundError("User not found. Please sign up first.")
        
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
    
    def verify_email_otp(self, email: str, otp: str, db: Session) -> dict:
        """
        Verify OTP and generate JWT access token.
        
        Args:
            email: Email address
            otp: OTP provided by user
            db: Database session
        
        Returns:
            Dictionary with success status, message, and JWT access token
        
        Raises:
            ValidationError: If input validation fails
            OTPException: If OTP verification fails
            UserNotFoundError: If user does not exist (should redirect to signup)
        """
        # Validate inputs
        validate_email(email)
        validate_otp(otp, expected_length=settings.OTP_LENGTH)
        
        # Verify OTP
        self.otp_service.verify_otp("", email, otp)  # Empty country code for email
        
        # Check if user exists
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            raise UserNotFoundError("User not found. Please sign up first.")
        
        # Create JWT token with user data
        token_data = {
            "sub": user.email,  # Subject (user identifier - email is primary key)
            "email": user.email,
            "name": user.name,
            "premium": user.premium
        }
        
        access_token = create_access_token(data=token_data)
        
        logger.info(f"OTP verified successfully for {email}, JWT token generated")
        
        return {
            "success": True,
            "message": "OTP verified successfully",
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    def signup_with_email_otp(self, name: str, email: str, db: Session = None) -> dict:
        """
        Signup user and send OTP for email verification.
        
        Args:
            name: User's name
            email: Email address
            db: Database session (required to check if user exists)
        
        Returns:
            Dictionary with success status and message
        
        Raises:
            ValidationError: If input validation fails
            UserNotFoundError: If user already exists (should redirect to login)
            SMSException: If email sending fails
        """
        # Validate inputs
        if not name or not name.strip():
            raise ValidationError("Name is required")
        validate_email(email)
        
        # Check if user already exists
        if db is not None:
            email_lower = email.lower().strip()
            existing_user = db.query(User).filter(User.email == email_lower).first()
            if existing_user:
                raise UserNotFoundError("User already exists. Please sign in instead.")
        
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
    
    def verify_signup_otp(self, name: str, email: str, otp: str, db: Session) -> dict:
        """
        Verify signup OTP and create user account.
        
        Args:
            name: User's name
            email: Email address
            otp: OTP provided by user
            db: Database session
        
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
        
        email_lower = email.lower().strip()
        name_stripped = name.strip()
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email_lower).first()
        if existing_user:
            # User already exists, just log them in
            token_data = {
                "sub": existing_user.email,  # Email is primary key
                "email": existing_user.email,
                "name": existing_user.name,
                "premium": existing_user.premium
            }
            access_token = create_access_token(data=token_data)
            logger.info(f"User {email} already exists, logged in")
        else:
            # Create new user with email as primary key, name, premium=false
            try:
                new_user = User(
                    email=email_lower,
                    name=name_stripped,
                    premium=False
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                
                # Create JWT token with user data
                token_data = {
                    "sub": new_user.email,  # Email is primary key
                    "email": new_user.email,
                    "name": new_user.name,
                    "premium": new_user.premium
                }
                access_token = create_access_token(data=token_data)
                logger.info(f"Signup verified successfully for {email} (name: {name}), user created with email: {new_user.email}")
            except Exception as e:
                db.rollback()
                logger.error(f"Error creating user: {str(e)}", exc_info=True)
                raise ValidationError(f"Failed to create user account: {str(e)}")
        
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

