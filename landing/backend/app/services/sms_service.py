"""
SMS service for sending OTP messages.
Supports multiple providers: console (dev), Twilio, AWS SNS, Plivo, MSG91.
"""
import logging
from typing import Optional
from app.config import get_settings
from app.core.exceptions import SMSException

logger = logging.getLogger(__name__)
settings = get_settings()


class SMSService:
    """Service for sending SMS messages."""
    
    def __init__(self):
        self.provider = settings.SMS_PROVIDER
        self._initialize_provider()
    
    def _initialize_provider(self) -> None:
        """Initialize the SMS provider based on configuration."""
        if self.provider == "twilio":
            try:
                from twilio.rest import Client
                self.client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
                self.twilio_number = settings.TWILIO_PHONE_NUMBER
            except ImportError:
                logger.warning("Twilio not installed. Falling back to console.")
                self.provider = "console"
        elif self.provider == "plivo":
            try:
                from plivo import RestClient
                self.plivo_client = RestClient(
                    settings.PLIVO_AUTH_ID,
                    settings.PLIVO_AUTH_TOKEN
                )
                self.plivo_number = settings.PLIVO_PHONE_NUMBER
            except ImportError:
                logger.warning("Plivo not installed. Falling back to console.")
                self.provider = "console"
        elif self.provider == "msg91":
            try:
                # MSG91 uses HTTP API, no SDK needed
                self.msg91_auth_key = settings.MSG91_AUTH_KEY
                self.msg91_sender_id = settings.MSG91_SENDER_ID
            except Exception:
                logger.warning("MSG91 configuration missing. Falling back to console.")
                self.provider = "console"
        elif self.provider == "aws_sns":
            try:
                import boto3
                self.sns_client = boto3.client(
                    'sns',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
            except ImportError:
                logger.warning("boto3 not installed. Falling back to console.")
                self.provider = "console"
    
    def send_otp(self, country_code: str, mobile_number: str, otp: str) -> bool:
        """
        Send OTP via SMS.
        
        Args:
            country_code: Country code (e.g., +1, +91)
            mobile_number: Mobile number without country code
            otp: The OTP to send
        
        Returns:
            True if sent successfully, False otherwise
        
        Raises:
            SMSException: If SMS sending fails
        """
        full_number = f"{country_code}{mobile_number}"
        message = f"Your Testino OTP is {otp}. Valid for 5 minutes."
        
        try:
            if self.provider == "twilio":
                return self._send_via_twilio(full_number, message)
            elif self.provider == "plivo":
                return self._send_via_plivo(full_number, message)
            elif self.provider == "msg91":
                return self._send_via_msg91(full_number, message)
            elif self.provider == "aws_sns":
                return self._send_via_aws_sns(full_number, message)
            else:
                # Console provider (for development)
                return self._send_via_console(full_number, message)
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            raise SMSException(f"Failed to send SMS: {str(e)}")
    
    def _send_via_twilio(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio."""
        try:
            self.client.messages.create(
                body=message,
                from_=self.twilio_number,
                to=phone_number
            )
            logger.info(f"SMS sent via Twilio to {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Twilio error: {e}")
            raise SMSException(f"Twilio SMS failed: {str(e)}")
    
    def _send_via_plivo(self, phone_number: str, message: str) -> bool:
        """Send SMS via Plivo (cheaper alternative to Twilio)."""
        try:
            response = self.plivo_client.messages.create(
                src=self.plivo_number,
                dst=phone_number,
                text=message
            )
            logger.info(f"SMS sent via Plivo to {phone_number}, message UUID: {response.message_uuid[0]}")
            return True
        except Exception as e:
            logger.error(f"Plivo error: {e}")
            raise SMSException(f"Plivo SMS failed: {str(e)}")
    
    def _send_via_msg91(self, phone_number: str, message: str) -> bool:
        """Send SMS via MSG91 (cheap option for India)."""
        try:
            import requests
            
            # MSG91 API endpoint
            url = "https://control.msg91.com/api/v5/flow/"
            
            headers = {
                "accept": "application/json",
                "authkey": self.msg91_auth_key,
                "content-type": "application/json"
            }
            
            # MSG91 requires phone number without + for India
            # Remove + and country code for Indian numbers, keep for international
            clean_number = phone_number.replace("+", "")
            
            payload = {
                "template_id": settings.MSG91_TEMPLATE_ID,  # Optional: use template
                "sender": self.msg91_sender_id,
                "short_url": "0",  # Disable URL shortening
                "mobiles": clean_number,
                "message": message
            }
            
            # Alternative: Use simple send endpoint if template not configured
            if not settings.MSG91_TEMPLATE_ID:
                url = "https://control.msg91.com/api/sendhttp.php"
                params = {
                    "authkey": self.msg91_auth_key,
                    "mobiles": clean_number,
                    "message": message,
                    "sender": self.msg91_sender_id,
                    "route": "4",  # Transactional route
                    "country": "91" if clean_number.startswith("91") else "0"  # 0 for international
                }
                response = requests.get(url, params=params)
            else:
                response = requests.post(url, json=payload, headers=headers)
            
            response.raise_for_status()
            logger.info(f"SMS sent via MSG91 to {phone_number}")
            return True
        except ImportError:
            logger.error("requests library not installed for MSG91")
            raise SMSException("MSG91 requires 'requests' library")
        except Exception as e:
            logger.error(f"MSG91 error: {e}")
            raise SMSException(f"MSG91 SMS failed: {str(e)}")
    
    def _send_via_aws_sns(self, phone_number: str, message: str) -> bool:
        """Send SMS via AWS SNS."""
        try:
            self.sns_client.publish(
                PhoneNumber=phone_number,
                Message=message
            )
            logger.info(f"SMS sent via AWS SNS to {phone_number}")
            return True
        except Exception as e:
            logger.error(f"AWS SNS error: {e}")
            raise SMSException(f"AWS SNS SMS failed: {str(e)}")
    
    def _send_via_console(self, phone_number: str, message: str) -> bool:
        """Log SMS to console (for development)."""
        logger.info(f"[SMS] To: {phone_number}")
        logger.info(f"[SMS] Message: {message}")
        print(f"\n{'='*50}")
        print(f"SMS Notification (Development Mode)")
        print(f"To: {phone_number}")
        print(f"Message: {message}")
        print(f"{'='*50}\n")
        return True


# Singleton instance
_sms_service: Optional[SMSService] = None


def get_sms_service() -> SMSService:
    """Get SMS service singleton instance."""
    global _sms_service
    if _sms_service is None:
        _sms_service = SMSService()
    return _sms_service

