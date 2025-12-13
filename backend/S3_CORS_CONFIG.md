# S3 CORS Configuration for Test Responses Bucket

The `testino-test-responses` S3 bucket needs CORS configuration to allow direct uploads from the browser using presigned URLs.

## CORS Configuration

Add the following CORS configuration to your S3 bucket `testino-test-responses`:

### Via AWS Console:

1. Go to AWS S3 Console
2. Select the bucket `testino-test-responses`
3. Go to the **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit** and paste the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://*.testino.space",
            "https://testino.space"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### Via AWS CLI:

```bash
aws s3api put-bucket-cors \
    --bucket testino-test-responses \
    --cors-configuration file://cors-config.json
```

Where `cors-config.json` contains:

```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
            "AllowedOrigins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "https://*.testino.space",
                "https://testino.space"
            ],
            "ExposeHeaders": [
                "ETag",
                "x-amz-server-side-encryption",
                "x-amz-request-id",
                "x-amz-id-2"
            ],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

### Via Terraform (if using Infrastructure as Code):

```hcl
resource "aws_s3_bucket_cors_configuration" "test_responses" {
  bucket = aws_s3_bucket.test_responses.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://*.testino.space",
      "https://testino.space"
    ]
    expose_headers  = ["ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"]
    max_age_seconds = 3000
  }
}
```

## Important Notes:

1. **AllowedOrigins**: Update the origins list to include:
   - Your local development URLs (localhost with different ports)
   - Your production/staging domains
   - Use wildcards (`*.testino.space`) for subdomains if needed

2. **AllowedMethods**: Must include `PUT` for file uploads

3. **AllowedHeaders**: Using `["*"]` allows all headers, which is needed for presigned URL uploads

4. **Security**: In production, consider restricting `AllowedOrigins` to only your actual domains

5. **Testing**: After updating CORS, you may need to wait a few minutes for changes to propagate

## Verification:

After configuring CORS, test the upload by:
1. Recording audio in the application
2. Checking browser console for CORS errors
3. Verifying the file appears in the S3 bucket

If you still see CORS errors:
- Clear browser cache
- Wait a few minutes for S3 CORS changes to propagate
- Check that the origin in the error matches one in your `AllowedOrigins` list

