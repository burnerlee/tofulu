"""
User model for the application.
"""
from sqlalchemy import Column, String, Boolean
from app.database import Base


class User(Base):
    """User model with email as primary key, name, and premium status."""
    
    __tablename__ = "users"
    
    email = Column(String, primary_key=True, nullable=False, unique=True)
    name = Column(String, nullable=False)
    premium = Column(Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<User(email={self.email}, name={self.name}, premium={self.premium})>"
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            "email": self.email,
            "name": self.name,
            "premium": self.premium
        }
