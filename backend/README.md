# Testino Backend API

A production-ready FastAPI backend service for the Testino TOEFL preparation platform, built following senior architect standards.

## Architecture

The backend follows a clean architecture pattern with clear separation of concerns:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Application entry point
│   ├── config.py               # Configuration management
│   ├── dependencies.py         # Dependency injection
│   ├── api/                    # API layer
│   │   └── v1/
│   │       ├── routes/         # Route handlers
│   │       │   ├── auth.py
│   │       │   └── health.py
│   │       └── schemas/        # Pydantic schemas
│   │           └── auth.py
│   ├── core/                   # Core functionality
│   │   ├── exceptions.py       # Custom exceptions
│   │   └── security.py        # Security utilities
│   ├── services/               # Business logic layer
│   │   ├── auth_service.py
│   │   ├── otp_service.py
│   │   └── sms_service.py
│   ├── models/                 # Data models
│   │   └── otp.py
│   └── utils/                  # Utility functions
│       └── validators.py
├── requirements.txt
├── .env.example
└── README.md
```

## Features

- **Clean Architecture**: Separation of concerns with service, model, and API layers
- **Type Safety**: Full type hints throughout the codebase
- **Error Handling**: Custom exception classes with proper HTTP status codes
- **Validation**: Pydantic schemas for request/response validation
- **Configuration Management**: Environment-based configuration with defaults
- **Dependency Injection**: Singleton pattern for services
- **Logging**: Structured logging throughout the application
- **CORS Support**: Configurable CORS middleware
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Server
PORT=8000
HOST=0.0.0.0
DEBUG=True

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# OTP Configuration
OTP_EXPIRY_SECONDS=300
OTP_MAX_ATTEMPTS=5

# SMS Provider (console, twilio, aws_sns)
SMS_PROVIDER=console

# Twilio (if using Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Run the Server

```bash
# Development mode with auto-reload
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload --port 8080
```

The API will be available at:
- API: `http://localhost:8080`
- Docs: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## API Endpoints

### Health Check

```http
GET /api/v1/health
```

### Authentication

#### Send OTP

```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "country_code": "+1",
  "mobile_number": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expires_in": 300
}
```

#### Verify OTP

```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "country_code": "+1",
  "mobile_number": "1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "access_token": "generated_token_here"
}
```

## Development

### Code Structure

- **Services**: Business logic and orchestration
- **Models**: Data structures and domain models
- **Routes**: HTTP request handlers
- **Schemas**: Request/response validation
- **Core**: Shared utilities and exceptions
- **Utils**: Helper functions

### Adding New Features

1. **New Endpoint**: Add route in `app/api/v1/routes/`
2. **New Service**: Add service in `app/services/`
3. **New Model**: Add model in `app/models/`
4. **New Schema**: Add schema in `app/api/v1/schemas/`

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Production Considerations

### 1. OTP Storage

Currently uses in-memory storage. For production:

- **Option 1**: Use Redis with TTL
- **Option 2**: Use PostgreSQL/MySQL with expiration

Update `app/services/otp_service.py` to use your storage backend.

### 2. SMS Service

Currently logs to console. For production:

- **Twilio**: Uncomment in `requirements.txt` and configure
- **AWS SNS**: Uncomment in `requirements.txt` and configure
- **Other**: Implement in `app/services/sms_service.py`

### 3. Database

Add database models and migrations:

```bash
# Install database dependencies
pip install sqlalchemy alembic psycopg2-binary

# Initialize Alembic
alembic init alembic

# Create migrations
alembic revision --autogenerate -m "Initial migration"
```

### 4. Authentication

Implement JWT tokens:

```bash
# Install JWT dependencies
pip install python-jose[cryptography] passlib[bcrypt]
```

### 5. Rate Limiting

Add rate limiting middleware:

```bash
pip install slowapi
```

### 6. Monitoring

Add logging and monitoring:

- Structured logging with JSON format
- APM integration (e.g., Sentry, Datadog)
- Health check endpoints

### 7. Security

- Use environment variables for secrets
- Implement HTTPS
- Add request rate limiting
- Validate and sanitize all inputs
- Use secure token generation

## Code Quality

- **Type Hints**: All functions have type hints
- **Docstrings**: All public functions documented
- **Error Handling**: Proper exception handling throughout
- **Validation**: Input validation at multiple layers
- **Logging**: Comprehensive logging for debugging
- **Configuration**: Environment-based configuration

## License

Proprietary - All rights reserved
