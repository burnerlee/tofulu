"""
Pydantic schemas for payment endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional


class CreateOrderRequest(BaseModel):
    """Request schema for creating a payment order."""
    
    amount: int = Field(
        ...,
        description="Amount in currency subunits (paise for INR). For ₹1000, use 100000",
        examples=[100000],
        gt=0
    )
    currency: str = Field(
        default="INR",
        description="Currency code (3 characters)",
        examples=["INR", "USD"],
        min_length=3,
        max_length=3
    )


class CreateOrderResponse(BaseModel):
    """Response schema for creating a payment order."""
    
    success: bool = Field(..., description="Whether the order was created successfully")
    order_id: str = Field(..., description="Razorpay order ID")
    key_id: str = Field(..., description="Razorpay key ID for client-side integration")
    amount: int = Field(..., description="Amount in currency subunits")
    currency: str = Field(..., description="Currency code")
    message: Optional[str] = Field(None, description="Response message")


class VerifyPaymentRequest(BaseModel):
    """Request schema for verifying a payment."""
    
    razorpay_payment_id: str = Field(
        ...,
        description="Razorpay payment ID from checkout response",
        examples=["pay_29QQoUBi66xm2f"]
    )
    razorpay_order_id: str = Field(
        ...,
        description="Razorpay order ID from checkout response",
        examples=["order_9A33XWu170gUtm"]
    )
    razorpay_signature: str = Field(
        ...,
        description="Razorpay signature from checkout response",
        examples=["9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"]
    )


class VerifyPaymentResponse(BaseModel):
    """Response schema for verifying a payment."""
    
    success: bool = Field(..., description="Whether the payment verification was successful")
    message: str = Field(..., description="Response message")
    payment_id: Optional[str] = Field(None, description="Payment ID if verification successful")
    order_id: Optional[str] = Field(None, description="Order ID if verification successful")

