"""
Test data route handlers.
"""
import logging
import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List
from pydantic import BaseModel

from app.core.security import verify_token
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User

logger = logging.getLogger(__name__)

# Security scheme for Bearer token authentication
security = HTTPBearer()

router = APIRouter(prefix="/tests", tags=["tests"])


class TestListItem(BaseModel):
    """Model for test list item response."""
    id: int
    name: str
    unlocked: bool

# Get the base directory (backend/)
# Path from tests.py: app/api/v1/routes/tests.py
# Go up 5 levels: app -> api -> v1 -> routes -> (tests.py is here)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
TESTS_DIR = BASE_DIR / "data" / "tests"

# Log the path for debugging (can be removed in production)
logger.info(f"Tests directory: {TESTS_DIR}")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
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


def check_user_can_access_test(test_authorization: str, user_premium: bool) -> bool:
    """
    Check if user can access a test based on authorization level.
    
    Args:
        test_authorization: Authorization level from test JSON (standard, premium, paid, null, empty)
        user_premium: Whether the user has premium access
    
    Returns:
        True if user can access, False otherwise
    """
    auth_level = test_authorization.lower() if test_authorization else ""
    
    # If test is standard/null/empty, all logged-in users can access
    if not auth_level or auth_level in ["standard", ""]:
        return True
    
    # If test is premium/paid, only premium users can access
    if auth_level in ["premium", "paid"]:
        return user_premium
    
    # Default: allow access (fallback)
    return True


@router.get(
    "",
    response_model=List[TestListItem],
    status_code=status.HTTP_200_OK,
    summary="List available tests",
    description="Get a list of all available tests with their unlock status based on user's authorization level."
)
async def list_tests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[TestListItem]:
    """
    List all available tests with their unlock status.
    
    For each test, checks the test_authorization field:
    - If standard/null/empty: all logged-in users can access
    - If premium/paid: only users with premium=True can access
    
    Args:
        current_user: Current authenticated user from JWT token
        db: Database session
    
    Returns:
        List of tests with id, name, and unlocked status
    """
    # Get user premium status from database
    user_email = current_user.get("sub") or current_user.get("email")
    user_premium = False
    
    if user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            user_premium = user.premium
        else:
            # Fallback to token data
            user_premium = current_user.get("premium", False)
    else:
        # Fallback to token data
        user_premium = current_user.get("premium", False)
    
    tests_list = []
    
    # Scan tests directory for all test files
    if not TESTS_DIR.exists():
        logger.warning(f"Tests directory not found: {TESTS_DIR}")
        return []
    
    # Get all test-*.json files
    test_files = sorted(TESTS_DIR.glob("test-*.json"))
    
    for test_file in test_files:
        try:
            # Extract test ID from filename (e.g., "test-1.json" -> 1)
            filename = test_file.stem  # "test-1"
            test_id_str = filename.replace("test-", "")
            
            try:
                test_id = int(test_id_str)
            except ValueError:
                logger.warning(f"Invalid test filename format: {test_file.name}")
                continue
            
            # Read test file to get name and authorization
            with open(test_file, 'r', encoding='utf-8') as f:
                test_data = json.load(f)
            
            test_name = test_data.get("testName", f"Test {test_id}")
            test_authorization = test_data.get("test_authorization", "")
            
            # Check if user can access this test
            unlocked = check_user_can_access_test(test_authorization, user_premium)
            
            tests_list.append(TestListItem(
                id=test_id,
                name=test_name,
                unlocked=unlocked
            ))
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing test file {test_file}: {e}")
            continue
        except Exception as e:
            logger.error(f"Error reading test file {test_file}: {e}")
            continue
    
    # Sort by test ID
    tests_list.sort(key=lambda x: x.id)
    
    return tests_list


@router.get(
    "/{test_id}",
    status_code=status.HTTP_200_OK,
    summary="Get test data",
    description="Retrieve test data by test ID. Requires authentication and authorization based on test_authorization field."
)
async def get_test(
    test_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get test data for a specific test ID.
    
    Authorization rules:
    - If test_authorization is null/standard/empty: all logged-in users can access
    - If test_authorization is premium/paid: only users with premium=True can access
    
    Args:
        test_id: The test ID (e.g., 1 for test-1.json)
        current_user: Current authenticated user from JWT token
        db: Database session
    
    Returns:
        Test data JSON (without test_authorization field)
    
    Raises:
        HTTPException: If test not found, unauthorized, or access denied
    """
    # Construct file path
    test_file = TESTS_DIR / f"test-{test_id}.json"
    
    # Check if file exists
    if not test_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test {test_id} not found"
        )
    
    try:
        # Read and parse JSON file
        with open(test_file, 'r', encoding='utf-8') as f:
            test_data = json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing test file {test_file}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reading test data"
        )
    except Exception as e:
        logger.error(f"Error reading test file {test_file}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reading test data"
        )
    
    # Check authorization
    test_authorization = test_data.get("test_authorization", "").lower() if test_data.get("test_authorization") else ""
    
    # If test requires premium access
    if test_authorization in ["premium", "paid"]:
        # Get user from database to check premium status
        user_email = current_user.get("sub") or current_user.get("email")
        if user_email:
            user = db.query(User).filter(User.email == user_email).first()
            if not user or not user.premium:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This test requires premium access"
                )
        else:
            # Fallback to token data
            if not current_user.get("premium", False):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This test requires premium access"
                )
    
    # Remove test_authorization field from response for security
    response_data = {k: v for k, v in test_data.items() if k != "test_authorization"}
    
    return response_data

