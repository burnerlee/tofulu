"""
Database configuration and session management.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

# Determine database URL
if settings.DATABASE_URL:
    database_url = settings.DATABASE_URL
else:
    # Default to SQLite for development
    database_url = "sqlite:///./testino.db"

# Create engine
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session.
    Use this in FastAPI route dependencies.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Call this on application startup.
    In debug mode, drops and recreates tables to ensure schema matches models.
    In production, only creates tables that don't exist (use Alembic for migrations).
    """
    if settings.DEBUG:
        # In development, drop and recreate to handle schema changes
        # WARNING: This will delete all data
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        # In production, only create tables that don't exist
        # Use Alembic migrations for schema changes
        Base.metadata.create_all(bind=engine)
