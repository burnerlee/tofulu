"""
Authentication route handlers.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.api.v1.schemas.auth import (
    SendEmailOTPRequest,
    SendEmailOTPResponse,
    VerifyEmailOTPRequest,
    VerifyEmailOTPResponse,
    SignupRequest,
    SignupResponse,
    UserResponse
)
from app.services.auth_service import get_auth_service
from app.core.exceptions import (
    TestinoException,
    ValidationError,
    OTPException,
    SMSException
)
from app.core.security import verify_token

# Security scheme for Bearer token authentication
security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/send-email-otp",
    response_model=SendEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP to email",
    description="Generate and send a 6-digit OTP to the provided email address."
)
async def send_email_otp(request: SendEmailOTPRequest) -> SendEmailOTPResponse:
    """
    Send OTP to the provided email address.
    
    - **email**: Email address for login
    
    Returns success status and OTP expiration time.
    """
    try:
        auth_service = get_auth_service()
        result = auth_service.send_email_otp(email=request.email)
        return SendEmailOTPResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except SMSException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e.message)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post(
    "/verify-email-otp",
    response_model=VerifyEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email OTP",
    description="Verify the OTP provided by the user and return an access token."
)
async def verify_email_otp(request: VerifyEmailOTPRequest) -> VerifyEmailOTPResponse:
    """
    Verify OTP and generate access token.
    
    - **email**: Email address
    - **otp**: 6-digit OTP code
    
    Returns success status and access token if verification succeeds.
    """
    try:
        auth_service = get_auth_service()
        result = auth_service.verify_email_otp(
            email=request.email,
            otp=request.otp
        )
        return VerifyEmailOTPResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except OTPException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign up with email",
    description="Create a new account and send verification OTP to email."
)
async def signup(request: SignupRequest) -> SignupResponse:
    """
    Sign up a new user.
    
    - **name**: User's name (what should we call you)
    - **email**: Email address
    
    Returns success status and OTP expiration time.
    """
    try:
        auth_service = get_auth_service()
        result = auth_service.signup_with_email_otp(
            name=request.name,
            email=request.email
        )
        return SignupResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except SMSException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e.message)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post(
    "/verify-signup",
    response_model=VerifyEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify signup OTP",
    description="Verify the signup OTP and create user account."
)
async def verify_signup(request: VerifyEmailOTPRequest) -> VerifyEmailOTPResponse:
    """
    Verify signup OTP and create account.
    
    - **name**: User's name (required)
    - **email**: Email address
    - **otp**: 6-digit OTP code
    
    Returns success status and access token if verification succeeds.
    """
    try:
        if not request.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name is required for signup"
            )
        auth_service = get_auth_service()
        result = auth_service.verify_signup_otp(
            name=request.name,
            email=request.email,
            otp=request.otp
        )
        return VerifyEmailOTPResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except OTPException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
    
    Returns:
        Decoded token payload with user information
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Get information about the currently authenticated user."
)
async def get_current_user_info(current_user: dict = Depends(get_current_user)) -> UserResponse:
    """
    Get current user information from JWT token.
    
    Returns user email and name from the authenticated token.
    """
    return UserResponse(
        email=current_user.get("email", current_user.get("sub", "")),
        name=current_user.get("name")
    )

