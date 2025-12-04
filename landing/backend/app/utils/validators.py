"""
Input validation utilities.
"""
import re
from app.core.exceptions import ValidationError


def validate_email(email: str) -> None:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
    
    Raises:
        ValidationError: If email is invalid
    """
    if not email:
        raise ValidationError("Email is required")
    
    email = email.strip().lower()
    
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        raise ValidationError("Invalid email format")
    
    if len(email) > 254:  # RFC 5321 limit
        raise ValidationError("Email address is too long")


def validate_mobile_number(mobile_number: str) -> None:
    """
    Validate mobile number format.
    
    Args:
        mobile_number: Mobile number to validate
    
    Raises:
        ValidationError: If mobile number is invalid
    """
    if not mobile_number:
        raise ValidationError("Mobile number is required")
    
    if not mobile_number.isdigit():
        raise ValidationError("Mobile number must contain only digits")
    
    if len(mobile_number) < 10:
        raise ValidationError("Mobile number is too short")
    
    if len(mobile_number) > 15:
        raise ValidationError("Mobile number is too long")


def validate_country_code(country_code: str) -> None:
    """
    Validate country code format.
    
    Args:
        country_code: Country code to validate
    
    Raises:
        ValidationError: If country code is invalid
    """
    if not country_code:
        raise ValidationError("Country code is required")
    
    if not country_code.startswith("+"):
        raise ValidationError("Country code must start with '+'")
    
    # Check if rest of the code is digits
    code_digits = country_code[1:]
    if not code_digits.isdigit():
        raise ValidationError("Country code must contain only digits after '+'")
    
    if len(code_digits) < 1 or len(code_digits) > 4:
        raise ValidationError("Country code must be between 1 and 4 digits")


def validate_otp(otp: str, expected_length: int = 6) -> None:
    """
    Validate OTP format.
    
    Args:
        otp: OTP to validate
        expected_length: Expected length of OTP
    
    Raises:
        ValidationError: If OTP is invalid
    """
    if not otp:
        raise ValidationError("OTP is required")
    
    if not otp.isdigit():
        raise ValidationError("OTP must contain only digits")
    
    if len(otp) != expected_length:
        raise ValidationError(f"OTP must be {expected_length} digits")

