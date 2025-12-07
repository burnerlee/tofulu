"""
Custom exception classes for the application.
"""
from typing import Optional


class TestinoException(Exception):
    """Base exception for all application exceptions."""
    
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class OTPException(TestinoException):
    """Base exception for OTP-related errors."""
    pass


class OTPNotFoundError(OTPException):
    """Raised when OTP is not found in storage."""
    
    def __init__(self, message: str = "OTP not found. Please request a new OTP."):
        super().__init__(message, status_code=400)


class OTPExpiredError(OTPException):
    """Raised when OTP has expired."""
    
    def __init__(self, message: str = "OTP has expired. Please request a new OTP."):
        super().__init__(message, status_code=400)


class OTPInvalidError(OTPException):
    """Raised when OTP is invalid."""
    
    def __init__(self, message: str = "Invalid OTP.", attempts_remaining: Optional[int] = None):
        if attempts_remaining is not None:
            message = f"{message} {attempts_remaining} attempts remaining."
        super().__init__(message, status_code=400)


class OTPMaxAttemptsExceededError(OTPException):
    """Raised when maximum OTP verification attempts are exceeded."""
    
    def __init__(self, message: str = "Too many failed attempts. Please request a new OTP."):
        super().__init__(message, status_code=400)


class SMSException(TestinoException):
    """Raised when SMS sending fails."""
    
    def __init__(self, message: str = "Failed to send SMS. Please try again later."):
        super().__init__(message, status_code=500)


class ValidationError(TestinoException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class UserNotFoundError(TestinoException):
    """Raised when user is not found."""
    
    def __init__(self, message: str = "User not found. Please sign up first."):
        super().__init__(message, status_code=404)




