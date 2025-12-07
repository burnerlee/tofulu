"""
Authentication route handlers.
"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
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
    SMSException,
    UserNotFoundError
)
from app.database import get_db
from sqlalchemy.orm import Session
from app.core.security import verify_token

# Security scheme for Bearer token authentication
security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/send-email-otp",
    response_model=SendEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Send OTP to email",
    description="Generate and send a 6-digit OTP to the provided email address. For login, checks if user exists first."
)
async def send_email_otp(
    request: SendEmailOTPRequest,
    db: Session = Depends(get_db)
) -> SendEmailOTPResponse:
    """
    Send OTP to the provided email address.
    For login, checks if user exists before sending OTP.
    
    - **email**: Email address for login
    
    Returns success status and OTP expiration time.
    """
    try:
        auth_service = get_auth_service()
        result = auth_service.send_email_otp(email=request.email, db=db)
        return SendEmailOTPResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
async def verify_email_otp(
    request: VerifyEmailOTPRequest,
    db: Session = Depends(get_db)
) -> VerifyEmailOTPResponse:
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
            otp=request.otp,
            db=db
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
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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
async def signup(
    request: SignupRequest,
    db: Session = Depends(get_db)
) -> SignupResponse:
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
            email=request.email,
            db=db
        )
        return SignupResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message)
        )
    except UserNotFoundError as e:
        # User already exists - return 409 Conflict
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e.message)
        )
    except SMSException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e.message)
        )
    except Exception as e:
        logger.error(f"Error in signup: {str(e)}", exc_info=True)
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
async def verify_signup(
    request: VerifyEmailOTPRequest,
    db: Session = Depends(get_db)
) -> VerifyEmailOTPResponse:
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
            otp=request.otp,
            db=db
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
        logger.error(f"Error in verify_signup: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
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
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current user information from JWT token.
    
    Returns user email, name, and premium status from the authenticated token.
    """
    # Get user from database to ensure we have the latest data
    user_email = current_user.get("sub") or current_user.get("email")
    if user_email:
        from app.models.user import User
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            return UserResponse(
                email=user.email,
                name=user.name,
                premium=user.premium
            )
    
    # Fallback to token data if user not found in DB
    return UserResponse(
        email=current_user.get("email", current_user.get("sub", "")),
        name=current_user.get("name"),
        premium=current_user.get("premium", False)
    )

