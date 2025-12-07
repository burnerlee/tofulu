"""
Health check route handlers.
"""
from fastapi import APIRouter
from datetime import datetime
from app.config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns API status and timestamp.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }




