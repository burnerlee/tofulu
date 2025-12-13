"""
Transaction model for payment transactions.
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class TransactionStatus(str, enum.Enum):
    """Transaction status enumeration."""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    REFUNDED = "refunded"
    FAILED = "failed"


class Transaction(Base):
    """Transaction model for Razorpay payments."""
    
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True)  # Internal transaction ID
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    user_email = Column(String, ForeignKey("users.email"), nullable=False)
    amount = Column(Integer, nullable=False)  # Amount in currency subunits (paise for INR)
    currency = Column(String, nullable=False, default="INR")
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    razorpay_payment_id = Column(String, unique=True, nullable=False)  # Store Razorpay's payment ID
    razorpay_order_id = Column(String, nullable=False)
    razorpay_signature = Column(String, nullable=True)  # Payment signature for verification
    method = Column(String, nullable=True)  # Payment method (card, upi, etc.)
    description = Column(Text, nullable=True)  # Payment description
    verified = Column(Boolean, default=False, nullable=False)  # Whether signature was verified
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship to order
    order = relationship("Order", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, order_id={self.order_id}, status={self.status}, verified={self.verified})>"
    
    def to_dict(self):
        """Convert transaction to dictionary."""
        return {
            "id": self.id,
            "order_id": self.order_id,
            "user_email": self.user_email,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status.value,
            "razorpay_payment_id": self.razorpay_payment_id,
            "razorpay_order_id": self.razorpay_order_id,
            "method": self.method,
            "description": self.description,
            "verified": self.verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

