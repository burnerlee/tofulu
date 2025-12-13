# AWS SES Sandbox Mode - How to Fix

## The Problem

You're seeing this error:
```
Email address is not verified. The following identities failed the check in region US-EAST-1: avi.aviral140@gmail.com
```

This means your AWS SES account is in **sandbox mode**, which restricts sending emails to only verified addresses.

## Solution Options

### Option 1: Verify the Recipient Email (Quick Fix for Testing)

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/home)
2. Click on **"Verified identities"** in the left sidebar
3. Click **"Create identity"**
4. Select **"Email address"**
5. Enter the email: `avi.aviral140@gmail.com`
6. Click **"Create identity"**
7. Check the email inbox and click the verification link
8. Once verified, you can send emails to this address

**Note**: You'll need to verify each email address you want to send to in sandbox mode.

### Option 2: Request Production Access (Recommended for Production)

This allows you to send emails to **any** email address without verification.

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/home)
2. Click on **"Account dashboard"** in the left sidebar
3. Look for **"Sending statistics"** section
4. Click **"Request production access"** button
5. Fill out the form:
   - **Mail Type**: Transactional
   - **Website URL**: Your website URL (e.g., https://testino.space)
   - **Use case description**: 
     ```
     We are sending OTP (One-Time Password) verification codes for user authentication 
     in our TOEFL preparation platform. These are transactional emails sent only when 
     users sign up or log in to verify their email addresses.
     ```
   - **Compliance**: Select appropriate options
   - **Additional contact information**: Your contact details
6. Submit the request
7. Wait for approval (usually 24-48 hours)

## Temporary Workaround: Use Console Mode for Development

While waiting for production access, you can use console mode for development:

1. Update your `.env` file:
```env
EMAIL_PROVIDER=console
```

2. Restart the backend server
3. OTPs will be logged to the console/server logs instead of being sent via email

## Check Your Current SES Status

To check if you're in sandbox mode:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/home)
2. Click **"Account dashboard"**
3. Look at **"Sending statistics"** section
4. If you see "Your account is in the Amazon SES sandbox", you're in sandbox mode

## After Getting Production Access

Once approved:
1. Your account will automatically move out of sandbox mode
2. You can send emails to any address
3. No need to verify recipient emails
4. You still need to verify your **sender** email (`hello@testino.space`)

## Verify Your Sender Email

Make sure your sender email is verified:

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/home)
2. Click **"Verified identities"**
3. Check if `hello@testino.space` is listed and verified
4. If not, create and verify it

## Testing

After verifying an email or getting production access:

1. Try signing up again with the verified email
2. Check the email inbox for the OTP
3. If it works, you're all set!

## Need Help?

- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- AWS SES Limits: https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html




