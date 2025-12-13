"""
Order model for payment orders.
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enumeration."""
    CREATED = "created"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Order(Base):
    """Order model for Razorpay orders."""
    
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True)  # Internal order ID
    user_email = Column(String, ForeignKey("users.email"), nullable=False)
    amount = Column(Integer, nullable=False)  # Amount in currency subunits (paise for INR)
    currency = Column(String, nullable=False, default="INR")
    receipt = Column(String, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.CREATED, nullable=False)
    razorpay_order_id = Column(String, unique=True, nullable=False)  # Store Razorpay's order ID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship to transactions
    transactions = relationship("Transaction", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, user_email={self.user_email}, amount={self.amount}, status={self.status})>"
    
    def to_dict(self):
        """Convert order to dictionary."""
        return {
            "id": self.id,
            "user_email": self.user_email,
            "amount": self.amount,
            "currency": self.currency,
            "receipt": self.receipt,
            "status": self.status.value,
            "razorpay_order_id": self.razorpay_order_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

