"""
Payment service for handling Razorpay payments.
"""
import logging
import hmac
import hashlib
import uuid
from typing import Optional
from sqlalchemy.orm import Session
import razorpay
from app.config import get_settings
from app.models.order import Order, OrderStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User
from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)
settings = get_settings()


class PaymentService:
    """Service for handling payment operations with Razorpay."""
    
    def __init__(self):
        """Initialize Razorpay client."""
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            logger.warning("Razorpay credentials not configured. Payment operations will fail.")
            self.client = None
        else:
            self.client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
    
    def create_order(
        self,
        user_email: str,
        amount: int,
        currency: str = "INR",
        db: Session = None
    ) -> dict:
        """
        Create a Razorpay order.
        
        Args:
            user_email: Email of the user making the payment
            amount: Amount in currency subunits (paise for INR)
            currency: Currency code (default: INR)
            db: Database session
        
        Returns:
            Dictionary with order details including order_id and key_id
        
        Raises:
            ValidationError: If input validation fails
            Exception: If order creation fails
        """
        if not self.client:
            raise Exception("Razorpay client not initialized. Please configure Razorpay credentials.")
        
        # Validate inputs
        if amount <= 0:
            raise ValidationError("Amount must be greater than 0")
        if len(currency) != 3:
            raise ValidationError("Currency must be 3 characters")
        
        # Generate receipt ID
        receipt_id = f"receipt_{uuid.uuid4().hex[:12]}"
        
        try:
            # Create order with Razorpay
            razorpay_order = self.client.order.create({
                "amount": amount,
                "currency": currency,
                "receipt": receipt_id,
            })
            
            logger.info(f"Razorpay order created: {razorpay_order.get('id')}")
            
            # Store order in database
            if db:
                order = Order(
                    id=str(uuid.uuid4()),  # Internal order ID
                    user_email=user_email,
                    amount=amount,
                    currency=currency,
                    receipt=receipt_id,
                    status=OrderStatus.CREATED,
                    razorpay_order_id=razorpay_order.get('id'),
                )
                db.add(order)
                db.commit()
                db.refresh(order)
                logger.info(f"Order stored in database: {order.id}")
            
            return {
                "success": True,
                "order_id": razorpay_order.get('id'),
                "key_id": settings.RAZORPAY_KEY_ID,
                "amount": amount,
                "currency": currency,
                "message": "Order created successfully"
            }
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {str(e)}", exc_info=True)
            raise Exception(f"Failed to create order: {str(e)}")
    
    def verify_payment(
        self,
        user_email: str,
        razorpay_payment_id: str,
        razorpay_order_id: str,
        razorpay_signature: str,
        db: Session = None
    ) -> dict:
        """
        Verify payment signature and update user premium status.
        
        Args:
            user_email: Email of the user making the payment
            razorpay_payment_id: Payment ID from Razorpay
            razorpay_order_id: Order ID from Razorpay
            razorpay_signature: Signature from Razorpay
        
        Returns:
            Dictionary with verification status
        
        Raises:
            ValidationError: If input validation fails
            Exception: If verification fails
        """
        if not self.client:
            raise Exception("Razorpay client not initialized. Please configure Razorpay credentials.")
        
        if not db:
            raise Exception("Database session is required for payment verification")
        
        try:
            # Find order in database
            order = db.query(Order).filter(
                Order.razorpay_order_id == razorpay_order_id
            ).first()
            
            if not order:
                raise ValidationError(f"Order not found: {razorpay_order_id}")
            
            if order.user_email != user_email:
                raise ValidationError("Order does not belong to this user")
            
            # Verify signature
            # According to Razorpay docs: HMAC SHA256(order_id + "|" + razorpay_payment_id, secret)
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Verify signature
            if not hmac.compare_digest(generated_signature, razorpay_signature):
                logger.error(f"Signature verification failed for payment: {razorpay_payment_id}")
                raise ValidationError("Payment signature verification failed")
            
            logger.info(f"Signature verified for payment: {razorpay_payment_id}")
            
            # Fetch payment details from Razorpay
            try:
                payment = self.client.payment.fetch(razorpay_payment_id)
                payment_status = payment.get('status', 'pending')
                payment_method = payment.get('method', '')
                payment_description = payment.get('description', '')
            except Exception as e:
                logger.warning(f"Could not fetch payment details from Razorpay: {str(e)}")
                payment_status = 'authorized'  # Assume authorized if we can't fetch
                payment_method = None
                payment_description = None
            
            # Map Razorpay status to our TransactionStatus
            status_mapping = {
                'authorized': TransactionStatus.AUTHORIZED,
                'captured': TransactionStatus.CAPTURED,
                'refunded': TransactionStatus.REFUNDED,
                'failed': TransactionStatus.FAILED,
            }
            transaction_status = status_mapping.get(payment_status, TransactionStatus.PENDING)
            
            # Check if transaction already exists
            transaction = db.query(Transaction).filter(
                Transaction.razorpay_payment_id == razorpay_payment_id
            ).first()
            
            if transaction:
                # Update existing transaction
                transaction.status = transaction_status
                transaction.verified = True
                transaction.razorpay_signature = razorpay_signature
                if payment_method:
                    transaction.method = payment_method
                if payment_description:
                    transaction.description = payment_description
            else:
                # Create new transaction
                transaction = Transaction(
                    id=str(uuid.uuid4()),  # Internal transaction ID
                    order_id=order.id,
                    user_email=user_email,
                    amount=order.amount,
                    currency=order.currency,
                    status=transaction_status,
                    razorpay_payment_id=razorpay_payment_id,
                    razorpay_order_id=razorpay_order_id,
                    razorpay_signature=razorpay_signature,
                    method=payment_method,
                    description=payment_description,
                    verified=True,
                )
                db.add(transaction)
            
            # Update order status
            if transaction_status == TransactionStatus.CAPTURED:
                order.status = OrderStatus.PAID
            elif transaction_status == TransactionStatus.FAILED:
                order.status = OrderStatus.FAILED
            
            # Update user premium status if payment is captured
            if transaction_status == TransactionStatus.CAPTURED:
                user = db.query(User).filter(User.email == user_email).first()
                if user:
                    user.premium = True
                    logger.info(f"User {user_email} upgraded to premium")
            
            db.commit()
            
            return {
                "success": True,
                "message": "Payment verified successfully",
                "payment_id": razorpay_payment_id,
                "order_id": razorpay_order_id
            }
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error verifying payment: {str(e)}", exc_info=True)
            db.rollback()
            raise Exception(f"Payment verification failed: {str(e)}")


# Singleton instance
_payment_service: Optional[PaymentService] = None


def get_payment_service() -> PaymentService:
    """Get or create payment service instance."""
    global _payment_service
    if _payment_service is None:
        _payment_service = PaymentService()
    return _payment_service

