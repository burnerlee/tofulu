"""
Test data route handlers.
"""
import logging
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.core.security import verify_token
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
from app.config import get_settings

logger = logging.getLogger(__name__)

# Security scheme for Bearer token authentication
security = HTTPBearer()

router = APIRouter(prefix="/tests", tags=["tests"])

# S3 bucket name for tests
TESTS_S3_BUCKET = "testino-tests"
# S3 bucket name for test responses
TEST_RESPONSES_S3_BUCKET = "testino-test-responses"

# Check if boto3 is available
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logger.warning("boto3 not installed. S3 operations will fail.")


class TestListItem(BaseModel):
    """Model for test list item response."""
    id: int
    name: str
    unlocked: bool


def get_s3_client():
    """
    Get S3 client configured with AWS credentials from settings.
    
    Returns:
        boto3 S3 client
    
    Raises:
        HTTPException: If boto3 is not available or credentials are missing
    """
    if not BOTO3_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: S3 support not available"
        )
    
    settings = get_settings()
    
    # Check if AWS credentials are configured
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        logger.error("AWS credentials not configured. Cannot access S3.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: AWS credentials not configured"
        )
    
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        return s3_client
    except Exception as e:
        logger.error(f"Failed to create S3 client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server error: Failed to initialize S3 client"
        )


def get_test_from_s3(test_id: int) -> Dict[str, Any]:
    """
    Fetch test JSON data from S3.
    
    Args:
        test_id: The test ID (e.g., 1 for test-1.json)
    
    Returns:
        Test data as dictionary
    
    Raises:
        HTTPException: If test not found or error accessing S3
    """
    s3_client = get_s3_client()
    test_key = f"test-{test_id}.json"
    
    try:
        # Fetch object from S3
        response = s3_client.get_object(Bucket=TESTS_S3_BUCKET, Key=test_key)
        test_data = json.loads(response['Body'].read().decode('utf-8'))
        return test_data
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code == 'NoSuchKey' or error_code == '404':
            logger.warning(f"Test {test_id} not found in S3: {test_key}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test {test_id} not found"
            )
        else:
            logger.error(f"Error fetching test {test_id} from S3: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error reading test data from S3"
            )
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing test JSON from S3 for test {test_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error parsing test data"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching test {test_id} from S3: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reading test data from S3"
        )


def list_tests_from_s3() -> List[Dict[str, Any]]:
    """
    List all test files from S3 bucket.
    
    Returns:
        List of test data dictionaries with id, name, and test_authorization
    """
    s3_client = get_s3_client()
    tests_list = []
    
    try:
        # List all objects with prefix "test-" in the bucket
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=TESTS_S3_BUCKET, Prefix="test-")
        
        for page in pages:
            if 'Contents' not in page:
                continue
            
            for obj in page['Contents']:
                key = obj['Key']
                
                # Only process files matching test-*.json pattern
                if not key.endswith('.json') or not key.startswith('test-'):
                    continue
                
                # Extract test ID from filename (e.g., "test-1.json" -> 1)
                filename = Path(key).stem  # "test-1"
                test_id_str = filename.replace("test-", "")
                
                try:
                    test_id = int(test_id_str)
                except ValueError:
                    logger.warning(f"Invalid test filename format in S3: {key}")
                    continue
                
                # Fetch test data to get name and authorization
                try:
                    test_data = get_test_from_s3(test_id)
                    test_name = test_data.get("testName", f"Test {test_id}")
                    test_authorization = test_data.get("test_authorization", "")
                    
                    tests_list.append({
                        "id": test_id,
                        "name": test_name,
                        "test_authorization": test_authorization
                    })
                except HTTPException:
                    # Skip tests that can't be read
                    logger.warning(f"Skipping test {test_id} due to read error")
                    continue
                except Exception as e:
                    logger.error(f"Error processing test {test_id} from S3: {e}")
                    continue
        
        return tests_list
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        logger.error(f"Error listing tests from S3: {e}")
        if error_code == 'NoSuchBucket':
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"S3 bucket '{TESTS_S3_BUCKET}' not found"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error listing tests from S3"
            )
    except Exception as e:
        logger.error(f"Unexpected error listing tests from S3: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing tests from S3"
        )


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


def resolve_asset_references(asset_references: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Resolve asset references by generating presigned URLs for S3 objects.
    
    For each assetReference entry:
    - If type is "s3_object", generates a presigned URL
    - Other types are passed through as-is (for future extension)
    
    Args:
        asset_references: List of asset reference dictionaries from test JSON
    
    Returns:
        List of resolved asset references with presigned URLs
    
    Raises:
        HTTPException: If any required asset is missing or cannot be resolved
    """
    settings = get_settings()
    resolved_references = []
    missing_assets = []
    
    # Get S3 client
    s3_client = get_s3_client()
    
    # Process each asset reference
    for asset_ref in asset_references:
        asset_id = asset_ref.get("id")
        asset_type = asset_ref.get("type")
        
        if not asset_id:
            logger.warning(f"Skipping asset reference without id: {asset_ref}")
            continue
        
        # Handle url type (constant URLs, no S3 call needed)
        if asset_type == "url":
            url = asset_ref.get("url")
            
            if not url:
                logger.warning(f"Skipping url reference without url field: {asset_ref}")
                missing_assets.append(f"{asset_id} (missing url)")
                continue
            
            # For url type, directly use the URL without any processing
            resolved_references.append({
                "id": asset_id,
                "type": "url",
                "reference": url
            })
            
            logger.debug(f"Resolved URL reference for {asset_id}: {url}")
        
        # Handle s3_object type
        elif asset_type == "s3_object":
            bucket = asset_ref.get("bucket")
            key = asset_ref.get("key")
            
            if not bucket or not key:
                logger.warning(f"Skipping s3_object reference without bucket/key: {asset_ref}")
                missing_assets.append(f"{asset_id} (missing bucket/key)")
                continue
            
            try:
                # Check if object exists before generating presigned URL
                try:
                    s3_client.head_object(Bucket=bucket, Key=key)
                except ClientError as e:
                    error_code = e.response.get('Error', {}).get('Code', '')
                    if error_code == '404' or error_code == 'NoSuchKey':
                        logger.error(f"S3 object does not exist: {bucket}/{key} for asset {asset_id}")
                        missing_assets.append(f"{asset_id} ({bucket}/{key})")
                    else:
                        logger.error(f"Error checking S3 object existence for {asset_id}: {e}")
                        missing_assets.append(f"{asset_id} (error: {error_code})")
                    continue
                
                # Generate presigned URL
                presigned_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': key},
                    ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRY_SECONDS
                )
                
                resolved_references.append({
                    "id": asset_id,
                    "type": "url",
                    "reference": presigned_url
                })
                
                logger.debug(f"Generated presigned URL for {asset_id}: {bucket}/{key}")
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for {asset_id}: {e}")
                missing_assets.append(f"{asset_id} (generation failed)")
                continue
        else:
            # For other types, log a warning but continue
            logger.debug(f"Skipping asset reference type '{asset_type}' for {asset_id} (not yet implemented)")
    
    # If any assets are missing, raise an error
    if missing_assets:
        logger.error(f"Missing assets detected: {', '.join(missing_assets)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="One or more test assets are missing or unavailable"
        )
    
    return resolved_references


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
    
    # List all tests from S3
    try:
        s3_tests = list_tests_from_s3()
        
        for test_info in s3_tests:
            test_id = test_info["id"]
            test_name = test_info["name"]
            test_authorization = test_info["test_authorization"]
            
            # Check if user can access this test
            unlocked = check_user_can_access_test(test_authorization, user_premium)
            
            tests_list.append(TestListItem(
                id=test_id,
                name=test_name,
                unlocked=unlocked
            ))
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error listing tests: {e}")
        # Return empty list on error to avoid breaking the API
        return []
    
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
    # Fetch test data from S3
    try:
        test_data = get_test_from_s3(test_id)
    except HTTPException:
        # Re-raise HTTP exceptions (404, 500, etc.)
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching test {test_id}: {e}")
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
    
    # Process assetReferences and add assetReferencesResolved
    asset_references = test_data.get("assetReferences", [])
    if asset_references:
        asset_references_resolved = resolve_asset_references(asset_references)
        response_data["assetReferencesResolved"] = asset_references_resolved
    
    return response_data


class UploadUrlRequest(BaseModel):
    """Request model for getting presigned upload URL."""
    user_email: str
    filename: str


@router.post(
    "/{test_id}/upload-url",
    status_code=status.HTTP_200_OK,
    summary="Get presigned URL for uploading test response",
    description="Generate a presigned URL for uploading test response files (e.g., audio) to S3."
)
async def get_upload_url(
    test_id: int,
    request: UploadUrlRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a presigned URL for uploading test response files to S3.
    
    The file will be uploaded to: user-email/test_id/filename
    
    Args:
        test_id: Test ID
        request: Upload URL request with user_email and filename
        current_user: Current authenticated user from JWT token
        db: Database session
    
    Returns:
        Dictionary with presigned_url, key, and bucket
    """
    # Verify user has access to this test (optional - can be removed if not needed)
    # For now, we'll just verify the user is authenticated
    
    # Get S3 client
    s3_client = get_s3_client()
    settings = get_settings()
    
    # Construct S3 key: user-email/test_id/filename
    # Sanitize user_email to be filesystem-safe (remove spaces, special chars)
    safe_user_email = (
        request.user_email
        .replace('@', '_at_')
        .replace('.', '_')
        .replace(' ', '_')  # Remove spaces
        .replace('/', '_')  # Remove slashes
        .replace('\\', '_')  # Remove backslashes
        .strip()  # Remove leading/trailing whitespace
    )
    s3_key = f"{safe_user_email}/{test_id}/{request.filename}"
    
    try:
        # Generate presigned URL for PUT operation (upload)
        # Note: CORS must be configured on the S3 bucket to allow uploads from browser
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': TEST_RESPONSES_S3_BUCKET,
                'Key': s3_key,
                'ContentType': 'audio/webm',  # Default to audio/webm, can be made configurable
            },
            ExpiresIn=settings.S3_PRESIGNED_URL_EXPIRY_SECONDS
        )
        
        logger.debug(f"Generated presigned URL for upload: {s3_key}")
        
        logger.info(f"Generated presigned upload URL for test {test_id}, user {request.user_email}, key: {s3_key}")
        
        return {
            "presigned_url": presigned_url,
            "key": s3_key,
            "bucket": TEST_RESPONSES_S3_BUCKET,
        }
    except Exception as e:
        logger.error(f"Error generating presigned upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )

