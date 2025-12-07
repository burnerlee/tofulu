"""
Email service for sending OTP messages.
Supports multiple providers: console (dev), Resend, AWS SES, SendGrid.
"""
import logging
from typing import Optional
from app.config import get_settings
from app.core.exceptions import SMSException

# Import boto3 exceptions for proper error handling
try:
    from botocore.exceptions import ClientError, BotoCoreError
except ImportError:
    # boto3 not installed, define dummy classes
    ClientError = Exception
    BotoCoreError = Exception

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """Service for sending email messages."""
    
    def __init__(self):
        self.provider = settings.EMAIL_PROVIDER
        self._initialize_provider()
    
    def _initialize_provider(self) -> None:
        """Initialize the email provider based on configuration."""
        if self.provider == "resend":
            try:
                from resend import Resend
                self.resend_client = Resend(settings.RESEND_API_KEY)
                self.resend_from_email = settings.RESEND_FROM_EMAIL
            except ImportError:
                logger.warning("Resend not installed. Falling back to console.")
                self.provider = "console"
        elif self.provider == "aws_ses":
            try:
                import boto3
                
                # Validate AWS credentials are provided
                if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
                    logger.warning("AWS credentials not configured. Falling back to console.")
                    logger.warning("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file")
                    self.provider = "console"
                    return
                
                if not settings.AWS_SES_FROM_EMAIL:
                    logger.warning("AWS_SES_FROM_EMAIL not configured. Falling back to console.")
                    logger.warning("Please set AWS_SES_FROM_EMAIL in your .env file")
                    self.provider = "console"
                    return
                
                self.ses_client = boto3.client(
                    'ses',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                self.ses_from_email = settings.AWS_SES_FROM_EMAIL
                logger.info(f"AWS SES initialized with from email: {self.ses_from_email}, region: {settings.AWS_REGION}")
            except ImportError:
                logger.warning("boto3 not installed. Falling back to console.")
                logger.warning("Install boto3: pip install boto3")
                self.provider = "console"
        elif self.provider == "sendgrid":
            try:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail
                self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                self.sendgrid_from_email = settings.SENDGRID_FROM_EMAIL
            except ImportError:
                logger.warning("SendGrid not installed. Falling back to console.")
                self.provider = "console"
    
    def send_otp(self, email: str, otp: str, name: Optional[str] = None, is_signup: bool = False) -> bool:
        """
        Send OTP via email.
        
        Args:
            email: Recipient email address
            otp: The OTP to send
            name: Optional recipient name
            is_signup: Whether this is for signup (True) or signin (False)
        
        Returns:
            True if sent successfully, False otherwise
        
        Raises:
            SMSException: If email sending fails
        """
        subject = "Your Testino Verification Code"
        message = self._generate_otp_email_body(otp, name, is_signup)
        
        try:
            if self.provider == "resend":
                return self._send_via_resend(email, subject, message)
            elif self.provider == "aws_ses":
                return self._send_via_aws_ses(email, subject, message)
            elif self.provider == "sendgrid":
                return self._send_via_sendgrid(email, subject, message)
            else:
                # Console provider (for development)
                return self._send_via_console(email, subject, message)
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            raise SMSException(f"Failed to send email: {str(e)}")
    
    def _generate_otp_email_body(self, otp: str, name: Optional[str] = None, is_signup: bool = False) -> str:
        """Generate HTML email body for OTP."""
        if name:
            greeting = f"Hi {name},"
            intro_text = "Your verification code for Testino is:" if is_signup else "Your sign-in verification code for Testino is:"
        else:
            greeting = "Hello,"
            intro_text = "Your sign-in verification code for Testino is:"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background-color: #086A6F; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Testino</h1>
                </div>
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <h2 style="color: #086A6F; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600;">{greeting}</h2>
                    <p style="color: #333; font-size: 16px; margin-bottom: 24px;">{intro_text}</p>
                    <div style="background-color: #f8f9fa; border: 2px solid #086A6F; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <div style="color: #086A6F; font-size: 36px; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace; font-weight: 700;">{otp}</div>
                    </div>
                    <p style="color: #666; font-size: 14px; margin-bottom: 8px;">This code will expire in 5 minutes.</p>
                    <p style="color: #999; font-size: 13px; margin-top: 32px; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="color: #666; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #086A6F;">The Testino Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_body
    
    def _send_via_resend(self, email: str, subject: str, message: str) -> bool:
        """Send email via Resend (recommended - free tier available)."""
        try:
            params = {
                "from": self.resend_from_email,
                "to": [email],
                "subject": subject,
                "html": message,
            }
            
            result = self.resend_client.emails.send(params)
            logger.info(f"Email sent via Resend to {email}, ID: {result.id}")
            return True
        except Exception as e:
            logger.error(f"Resend error: {e}")
            raise SMSException(f"Resend email failed: {str(e)}")
    
    def _send_via_aws_ses(self, email: str, subject: str, message: str) -> bool:
        """Send email via AWS SES (very cheap at scale)."""
        try:
            # Check if SES client is initialized
            if not hasattr(self, 'ses_client') or self.ses_client is None:
                raise SMSException(
                    "AWS SES client not initialized. Please check your AWS credentials configuration."
                )
            
            if not self.ses_from_email:
                raise SMSException(
                    "AWS_SES_FROM_EMAIL not configured. Please set it in your .env file."
                )
            
            response = self.ses_client.send_email(
                Source=self.ses_from_email,
                Destination={'ToAddresses': [email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {
                        'Html': {'Data': message, 'Charset': 'UTF-8'}
                    }
                }
            )
            logger.info(f"Email sent via AWS SES to {email}, MessageId: {response['MessageId']}")
            return True
        except ClientError as e:
            # Handle boto3 ClientError specifically - this is the main exception type from AWS APIs
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            
            logger.error(f"AWS SES ClientError - Code: {error_code}, Message: {error_message}")
            
            if error_code == "MessageRejected":
                if "not verified" in error_message.lower():
                    raise SMSException(
                        f"AWS SES is in sandbox mode. The email address '{email}' needs to be verified in AWS SES. "
                        f"Please verify this email in the AWS SES console, or request production access to send to any email address. "
                        f"See: https://console.aws.amazon.com/ses/home"
                    )
                elif "sandbox" in error_message.lower():
                    raise SMSException(
                        f"AWS SES is in sandbox mode. You can only send emails to verified addresses. "
                        f"Please verify '{email}' in AWS SES console or request production access."
                    )
                else:
                    raise SMSException(f"AWS SES message rejected: {error_message}")
            elif error_code == "Throttling":
                raise SMSException(
                    f"AWS SES rate limit exceeded. Please wait a moment and try again."
                )
            elif error_code == "InvalidParameterValue":
                raise SMSException(
                    f"AWS SES invalid parameter: {error_message}. Please check your configuration."
                )
            elif error_code == "AccessDenied":
                raise SMSException(
                    f"AWS SES access denied. Please check your AWS credentials and IAM permissions. "
                    f"Your IAM user needs 'ses:SendEmail' permission."
                )
            elif error_code == "InvalidAccessKeyId":
                raise SMSException(
                    f"AWS SES authentication failed: Invalid access key ID. Please check your AWS_ACCESS_KEY_ID."
                )
            elif error_code == "SignatureDoesNotMatch":
                raise SMSException(
                    f"AWS SES authentication failed: Signature mismatch. Please check your AWS_SECRET_ACCESS_KEY."
                )
            elif error_code == "InvalidClientTokenId":
                raise SMSException(
                    f"AWS SES authentication failed: Invalid client token. Please check your AWS credentials."
                )
            else:
                raise SMSException(f"AWS SES error ({error_code}): {error_message}")
        except BotoCoreError as e:
            # Handle other boto3 core errors (network issues, etc.)
            error_str = str(e)
            logger.error(f"AWS SES BotoCoreError: {error_str}")
            raise SMSException(f"AWS SES connection error: {error_str}. Please check your network connection and AWS configuration.")
        except Exception as e:
            # Handle any other unexpected errors
            error_str = str(e)
            error_type = type(e).__name__
            logger.error(f"AWS SES unexpected error ({error_type}): {error_str}")
            
            # Fallback: Check for common error patterns in string representation
            if "MessageRejected" in error_str and "not verified" in error_str:
                raise SMSException(
                    f"AWS SES is in sandbox mode. The email address '{email}' needs to be verified in AWS SES. "
                    f"Please verify this email in the AWS SES console, or request production access to send to any email address. "
                    f"See: https://console.aws.amazon.com/ses/home"
                )
            elif "MessageRejected" in error_str and "sandbox" in error_str.lower():
                raise SMSException(
                    f"AWS SES is in sandbox mode. You can only send emails to verified addresses. "
                    f"Please verify '{email}' in AWS SES console or request production access."
                )
            elif "Throttling" in error_str or "Rate exceeded" in error_str:
                raise SMSException(
                    f"AWS SES rate limit exceeded. Please wait a moment and try again."
                )
            elif "InvalidAccessKeyId" in error_str or "SignatureDoesNotMatch" in error_str:
                raise SMSException(
                    f"AWS SES authentication failed. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY. "
                    f"Error: {error_str}"
                )
            else:
                raise SMSException(f"AWS SES email failed: {error_str}")
    
    def _send_via_sendgrid(self, email: str, subject: str, message: str) -> bool:
        """Send email via SendGrid."""
        try:
            from sendgrid.helpers.mail import Mail
            
            mail = Mail(
                from_email=self.sendgrid_from_email,
                to_emails=email,
                subject=subject,
                html_content=message
            )
            
            response = self.sendgrid_client.send(mail)
            logger.info(f"Email sent via SendGrid to {email}, Status: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"SendGrid error: {e}")
            raise SMSException(f"SendGrid email failed: {str(e)}")
    
    def _send_via_console(self, email: str, subject: str, message: str) -> bool:
        """Log email to console (for development)."""
        logger.info(f"[EMAIL] To: {email}")
        logger.info(f"[EMAIL] Subject: {subject}")
        print(f"\n{'='*50}")
        print(f"Email Notification (Development Mode)")
        print(f"To: {email}")
        print(f"Subject: {subject}")
        print(f"Message: {message[:200]}...")
        print(f"{'='*50}\n")
        return True


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get email service singleton instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

