# AWS SES Setup Guide

## Required Configuration Values

To use AWS SES for sending email OTPs, you need to configure the following environment variables in your `.env` file:

```env
# Email Provider
EMAIL_PROVIDER=aws_ses

# AWS Credentials (Required)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1  # or your preferred region (us-west-2, eu-west-1, etc.)

# AWS SES Configuration (Required)
AWS_SES_FROM_EMAIL=noreply@yourdomain.com  # Must be verified in AWS SES
```

## Configuration Details

### 1. EMAIL_PROVIDER
- **Value**: `aws_ses`
- **Description**: Sets the email service provider to AWS SES

### 2. AWS_ACCESS_KEY_ID
- **Type**: String
- **Description**: Your AWS IAM user's access key ID
- **How to get**: 
  1. Go to AWS Console → IAM → Users
  2. Create a new user or select existing user
  3. Go to "Security credentials" tab
  4. Create access key
  5. Copy the Access Key ID

### 3. AWS_SECRET_ACCESS_KEY
- **Type**: String (secret)
- **Description**: Your AWS IAM user's secret access key
- **How to get**: Same as above - copy the Secret Access Key (only shown once!)
- **Security**: Never commit this to version control

### 4. AWS_REGION
- **Type**: String
- **Default**: `us-east-1`
- **Description**: AWS region where your SES is configured
- **Common regions**:
  - `us-east-1` (N. Virginia) - Default
  - `us-west-2` (Oregon)
  - `eu-west-1` (Ireland)
  - `ap-southeast-1` (Singapore)
- **Note**: SES is region-specific, use the region where you verified your domain/email

### 5. AWS_SES_FROM_EMAIL
- **Type**: Email address
- **Description**: The "From" email address for your emails
- **Requirements**:
  - Must be verified in AWS SES (see setup steps below)
  - Format: `noreply@yourdomain.com` or `support@yourdomain.com`
  - Can be a verified email address or a verified domain

## AWS SES Setup Steps

### Step 1: Create AWS Account
1. Sign up at https://aws.amazon.com/
2. Complete account verification

### Step 2: Verify Your Email Address or Domain

#### Option A: Verify Single Email (Sandbox Mode)
1. Go to AWS Console → SES → Verified identities
2. Click "Create identity"
3. Select "Email address"
4. Enter your email (e.g., `noreply@yourdomain.com`)
5. Check your email and click verification link
6. **Note**: In sandbox mode, you can only send to verified emails

#### Option B: Verify Domain (Production Mode - Recommended)
1. Go to AWS Console → SES → Verified identities
2. Click "Create identity"
3. Select "Domain"
4. Enter your domain (e.g., `yourdomain.com`)
5. Add DNS records to your domain's DNS settings:
   - CNAME records for DKIM
   - TXT record for domain verification
   - MX record (optional, for receiving emails)
6. Wait for verification (can take up to 72 hours)

### Step 3: Request Production Access (Required to send to any email)
1. Go to AWS Console → SES → Account dashboard
2. Click "Request production access"
3. Fill out the form:
   - Use case: Transactional emails (OTP verification)
   - Website URL: Your website
   - Describe your use case: "Sending OTP verification codes for user authentication"
4. Wait for approval (usually 24-48 hours)

### Step 4: Create IAM User with SES Permissions
1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Enter username (e.g., `ses-email-sender`)
4. Select "Attach policies directly"
5. Attach policy: `AmazonSESFullAccess` (or create custom policy with minimal permissions)
6. Click "Create user"
7. Go to "Security credentials" tab
8. Click "Create access key"
9. Select "Application running outside AWS"
10. Copy both Access Key ID and Secret Access Key

### Step 5: Configure Your Application
1. Add to your `.env` file:
```env
EMAIL_PROVIDER=aws_ses
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

2. Install boto3 (if not already installed):
```bash
pip install boto3
```

3. Uncomment in `requirements.txt`:
```txt
boto3==1.29.7
```

## Minimal IAM Policy (Recommended)

Instead of full SES access, create a custom policy with minimal permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

## Pricing

- **Free Tier**: 62,000 emails/month (if sending from EC2)
- **After Free Tier**: $0.10 per 1,000 emails
- **Very cost-effective** for high volume

## Testing

### Test in Sandbox Mode
1. Verify your email address
2. Send test email to verified address
3. Check email inbox

### Test in Production Mode
1. Request production access
2. Wait for approval
3. Send to any email address

## Troubleshooting

### Common Issues

1. **"Email address not verified"**
   - Solution: Verify the email in SES console

2. **"Account is in sandbox mode"**
   - Solution: Request production access

3. **"Invalid credentials"**
   - Solution: Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

4. **"Region mismatch"**
   - Solution: Ensure AWS_REGION matches where you verified your email/domain

5. **"Rate limit exceeded"**
   - Solution: SES has rate limits (1 email/second in sandbox, higher in production)

## Security Best Practices

1. **Never commit credentials to git**
   - Use `.env` file (already in `.gitignore`)
   - Use AWS Secrets Manager for production

2. **Use IAM roles instead of access keys** (if running on EC2)
   - More secure
   - No credentials to manage

3. **Rotate access keys regularly**
   - Every 90 days recommended

4. **Use minimal IAM permissions**
   - Only grant `ses:SendEmail` permission
   - Don't use `AmazonSESFullAccess` in production

## Example .env Configuration

```env
# Email Provider
EMAIL_PROVIDER=aws_ses

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# AWS SES
AWS_SES_FROM_EMAIL=noreply@testino.space
```

## Next Steps

1. Set up AWS account and verify email/domain
2. Create IAM user with SES permissions
3. Configure `.env` file with credentials
4. Install boto3: `pip install boto3`
5. Test sending email OTP
6. Request production access when ready




