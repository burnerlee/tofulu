"""
Payment route handlers.
"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
from app.api.v1.schemas.payment import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from app.services.payment_service import get_payment_service
from app.core.exceptions import ValidationError
from app.database import get_db
from app.core.security import verify_token

# Security scheme for Bearer token authentication
security = HTTPBearer()

router = APIRouter(prefix="/payments", tags=["payments"])


async def get_current_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Get current user email from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
    
    Returns:
        User email from token
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("sub") or payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: email not found"
        )
    return email


@router.post(
    "/create-order",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Create payment order",
    description="Create a Razorpay order for payment processing"
)
async def create_order(
    request: CreateOrderRequest,
    user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
) -> CreateOrderResponse:
    """
    Create a payment order.
    
    - **amount**: Amount in currency subunits (cents)
    - **currency**: Currency code (3 characters, default: USD)
    
    Returns order details including Razorpay order_id and key_id for client-side integration.
    """
    try:
        payment_service = get_payment_service()
        result = payment_service.create_order(
            user_email=user_email,
            amount=request.amount,
            currency=request.currency,
            db=db
        )
        return CreateOrderResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message) if hasattr(e, 'message') else str(e)
        )
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.post(
    "/verify",
    response_model=VerifyPaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify payment",
    description="Verify Razorpay payment signature and upgrade user to premium"
)
async def verify_payment(
    request: VerifyPaymentRequest,
    user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
) -> VerifyPaymentResponse:
    """
    Verify payment signature and upgrade user to premium.
    
    - **razorpay_payment_id**: Payment ID from Razorpay checkout
    - **razorpay_order_id**: Order ID from Razorpay checkout
    - **razorpay_signature**: Signature from Razorpay checkout
    
    Returns verification status. On success, user is upgraded to premium.
    """
    try:
        payment_service = get_payment_service()
        result = payment_service.verify_payment(
            user_email=user_email,
            razorpay_payment_id=request.razorpay_payment_id,
            razorpay_order_id=request.razorpay_order_id,
            razorpay_signature=request.razorpay_signature,
            db=db
        )
        return VerifyPaymentResponse(**result)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e.message) if hasattr(e, 'message') else str(e)
        )
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )

