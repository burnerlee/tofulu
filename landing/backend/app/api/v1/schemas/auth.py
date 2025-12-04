"""
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional


class SendEmailOTPRequest(BaseModel):
    """Request schema for sending email OTP."""
    
    email: EmailStr = Field(
        ...,
        description="Email address",
        examples=["user@example.com"]
    )


class VerifyEmailOTPRequest(BaseModel):
    """Request schema for verifying email OTP."""
    
    email: EmailStr = Field(
        ...,
        description="Email address",
        examples=["user@example.com"]
    )
    otp: str = Field(
        ...,
        description="6-digit OTP",
        examples=["123456", "654321"],
        min_length=6,
        max_length=6
    )
    name: Optional[str] = Field(
        None,
        description="User's name (required for signup verification)",
        examples=["John Doe"]
    )
    
    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v: str) -> str:
        """Validate OTP format."""
        if not v.isdigit():
            raise ValueError("OTP must contain only digits")
        if len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v


class SignupRequest(BaseModel):
    """Request schema for user signup."""
    
    name: str = Field(
        ...,
        description="User's name (what should we call you)",
        examples=["John Doe", "Jane Smith"],
        min_length=1,
        max_length=100
    )
    email: EmailStr = Field(
        ...,
        description="Email address",
        examples=["user@example.com"]
    )
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name format."""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class SendEmailOTPResponse(BaseModel):
    """Response schema for sending email OTP."""
    
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    expires_in: int = Field(..., description="OTP expiration time in seconds")


class VerifyEmailOTPResponse(BaseModel):
    """Response schema for verifying email OTP."""
    
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    access_token: Optional[str] = Field(None, description="JWT access token for authenticated requests")
    token_type: Optional[str] = Field("bearer", description="Token type (always 'bearer' for JWT)")


class SignupResponse(BaseModel):
    """Response schema for signup."""
    
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    expires_in: int = Field(..., description="OTP expiration time in seconds")


class UserResponse(BaseModel):
    """Response schema for user information."""
    
    email: str = Field(..., description="User's email address")
    name: Optional[str] = Field(None, description="User's name")

