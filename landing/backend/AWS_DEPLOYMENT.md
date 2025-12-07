# AWS Deployment Guide with Caddy

This guide walks you through deploying the Testino Backend API on AWS EC2 with Caddy as a reverse proxy.

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04 LTS recommended)
- Domain name pointing to your server's IP address
- SSH access to your server
- Security group configured to allow:
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 8080 (Backend API - can be restricted to localhost only after setup)

## Step 1: Install Caddy on Ubuntu

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install prerequisites
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

# Add Caddy repository
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Update package list and install Caddy
sudo apt update
sudo apt install caddy -y

# Verify installation
caddy version
```

## Step 2: Configure Caddy

Create or edit the Caddy configuration file:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Option A: Serve Static Files (Frontend Only)

If you want to serve your built frontend static files from a domain:

```
yourdomain.com {
    # Root directory for static files (Vite builds to 'dist' by default)
    # IMPORTANT: Use absolute path, not relative path
    root * /home/ubuntu/tofulu/landing/dist
    
    # Enable file server
    file_server
    
    # Handle SPA routing - try files, fallback to index.html for client-side routing
    # This ensures React Router routes work correctly
    try_files {path} /index.html
    
    # Optional: Add security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Optional: Enable compression
    encode gzip zstd
}
```

**Important Notes:**
- Use **absolute paths** (starting with `/`), not relative paths
- The path must point to the `dist` directory containing `index.html`
- Ensure the `caddy` user has read permissions on the directory
- The `try_files` directive must come after `file_server` for proper SPA routing

### Option B: Serve Static Files + Reverse Proxy (Frontend + Backend)

If you want to serve your frontend and proxy API requests to your backend:

```
yourdomain.com {
    # Root directory for static files
    # IMPORTANT: Use absolute path
    root * /home/ubuntu/tofulu/landing/dist
    
    # Proxy API requests to backend FIRST (before file_server)
    handle /api/* {
        reverse_proxy localhost:8080
    }
    
    # Enable file server for all other requests
    file_server
    
    # Handle SPA routing - try files, fallback to index.html
    try_files {path} /index.html
    
    # Optional: Add security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Optional: Enable compression
    encode gzip zstd
}
```

**Important Notes:**
- The `handle /api/*` block should come **before** `file_server` to ensure API requests are proxied correctly
- Use absolute paths for the root directory
- Ensure proper file permissions for the dist folder

### Option C: Separate Domains (Frontend and Backend on Different Domains)

If you have separate domains for frontend and backend:

```
# Frontend domain
www.yourdomain.com {
    root * /path/to/your/landing/dist
    file_server
    try_files {path} /index.html
    
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
    }
    
    encode gzip zstd
}

# Backend API domain
api.yourdomain.com {
    reverse_proxy localhost:8080
    
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Access-Control-Allow-Origin "https://www.yourdomain.com"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    
    encode gzip zstd
}
```

### Option D: Backend API Only (No Static Files)

If you only want to serve the backend API:

```
yourdomain.com {
    reverse_proxy localhost:8080
    
    # Optional: Add security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Optional: Enable compression
    encode gzip zstd
}
```

**Notes:**
- Replace `/path/to/your/landing/dist` with the actual path to your built frontend files
- The `try_files` directive is essential for React Router (SPA) - it ensures all routes fallback to `index.html`
- Even though your backend runs on `0.0.0.0:8080`, Caddy can proxy to `localhost:8080` since they're on the same server
- The backend listening on `0.0.0.0` allows it to accept connections from all network interfaces, while Caddy connects via the loopback interface

## Step 3: Start and Enable Caddy

```bash
# Test the configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Start Caddy service
sudo systemctl start caddy

# Enable Caddy to start on boot
sudo systemctl enable caddy

# Check status
sudo systemctl status caddy
```

## Step 4: Build and Deploy Frontend (If Serving Static Files)

If you're serving static files with Caddy, you need to build your frontend and place it in the correct location:

### 4.1 Build Frontend Locally or on Server

**Option 1: Build on your local machine and upload:**

```bash
# On your local machine
cd /path/to/landing
npm install
npm run build

# This creates a 'dist' directory with built files
# Upload the 'dist' directory to your server
scp -r dist/ user@your-server:/path/to/deployment/landing/
```

**Option 2: Build directly on the server:**

```bash
# On your server
cd /path/to/landing

# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies and build
npm install
npm run build

# The 'dist' directory will be created in your landing folder
```

### 4.2 Verify Build Output

```bash
# Check that dist directory exists and has files
ls -la /path/to/landing/dist/

# You should see files like:
# - index.html
# - assets/ (directory with JS, CSS, images)
```

### 4.3 Update Caddyfile Path

Make sure the path in your Caddyfile matches where you placed the `dist` directory:

```
yourdomain.com {
    root * /path/to/deployment/landing/dist  # Update this path
    file_server
    try_files {path} /index.html
    # ... rest of config
}
```

## Step 5: Configure Backend Service

### 4.1 Update Environment Variables

Ensure your backend is configured to run on `0.0.0.0:8080`. Update your `.env` file:

```env
# Server Configuration
PORT=8080
HOST=0.0.0.0
DEBUG=False

# CORS - Update with your production domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# OTP Configuration
OTP_EXPIRY_SECONDS=300
OTP_MAX_ATTEMPTS=5

# Email Provider (configure as needed)
EMAIL_PROVIDER=aws_ses

# Add other required environment variables...
```

**Important:** The `HOST=0.0.0.0` ensures the backend listens on all network interfaces, making it accessible from Caddy running on the same server.

### 4.2 Install Python Dependencies

```bash
# Navigate to backend directory
cd /path/to/your/backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Step 6: Set Up Backend as Systemd Service

Create a systemd service file for automatic startup and management:

```bash
sudo nano /etc/systemd/system/testino-backend.service
```

Add the following configuration (update paths as needed):

```ini
[Unit]
Description=Testino Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/tofulu/landing/backend
Environment="PATH=/home/ubuntu/tofulu/landing/backend/venv/bin:/usr/bin:/usr/local/bin"
ExecStart=/home/ubuntu/tofulu/landing/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Key points:**
- `--host 0.0.0.0` ensures the server listens on all interfaces
- `--port 8080` matches the port configured in your `.env` file
- Update `WorkingDirectory` and `ExecStart` paths to match your actual deployment location

Enable and start the service:

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable testino-backend

# Start the service
sudo systemctl start testino-backend

# Check status
sudo systemctl status testino-backend

# View logs
sudo journalctl -u testino-backend -f
```

## Step 7: Firewall Configuration

Configure UFW (Uncomplicated Firewall) to allow necessary ports:

```bash
# Allow HTTP and HTTPS (required for Caddy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend port (optional - can be restricted to localhost after setup)
# Since backend runs on 0.0.0.0, you may want to restrict this to localhost only
sudo ufw allow from 127.0.0.1 to any port 8080

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Security Note:** Since your backend runs on `0.0.0.0:8080`, it's accessible from outside. Consider:
- Restricting port 8080 to localhost only in your security group
- Or using `ufw` to only allow localhost connections to port 8080

## Step 8: Verify Setup

### 8.1 Check Caddy Status

```bash
# Check Caddy service status
sudo systemctl status caddy

# View Caddy logs
sudo journalctl -u caddy -f

# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile
```

### 8.2 Check Backend Status

```bash
# Check backend service status
sudo systemctl status testino-backend

# View backend logs
sudo journalctl -u testino-backend -f

# Test backend directly (should work since it's on 0.0.0.0)
curl http://localhost:8080/api/v1/health
```

### 8.3 Test Through Caddy

```bash
# Test API through Caddy (HTTPS)
curl https://yourdomain.com/api/v1/health

# Test root endpoint
curl https://yourdomain.com/

# Test API docs
# Visit: https://yourdomain.com/docs
```

## Step 9: SSL/TLS Certificate

Caddy automatically obtains and renews SSL certificates from Let's Encrypt. The first time you start Caddy with a valid domain, it will:

1. Automatically obtain an SSL certificate
2. Configure HTTPS
3. Set up automatic renewal

You can verify the certificate:

```bash
# Check certificate status
sudo caddy list-certificates
```

## Troubleshooting

### Static Files Not Serving (Dist Folder Issues)

**Common issues and solutions:**

1. **Check if dist folder exists and has correct permissions:**
```bash
# Verify dist folder exists
ls -la /path/to/your/landing/dist/

# Check if index.html exists
ls -la /path/to/your/landing/dist/index.html

# Fix permissions if needed (Caddy runs as caddy user)
sudo chown -R caddy:caddy /path/to/your/landing/dist
sudo chmod -R 755 /path/to/your/landing/dist
```

2. **Verify Caddyfile path is correct:**
```bash
# Check your Caddyfile
sudo cat /etc/caddy/Caddyfile

# Make sure the path matches exactly (use absolute path)
# Wrong: ~/landing/dist or ./dist
# Correct: /home/ubuntu/landing/dist
```

3. **Check Caddy logs for errors:**
```bash
# View recent Caddy logs
sudo journalctl -u caddy -n 100 --no-pager

# Look for errors like:
# - "no such file or directory"
# - "permission denied"
# - "404 not found"
```

4. **Test with a minimal Caddyfile:**
```bash
# Create a test Caddyfile to isolate the issue
sudo nano /etc/caddy/Caddyfile
```

Use this minimal configuration to test:
```
yourdomain.com {
    root * /path/to/your/landing/dist
    file_server
}
```

Then restart Caddy:
```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

5. **Verify file_server is working:**
```bash
# Test if files are accessible directly
curl -I https://yourdomain.com/index.html

# Check if assets are loading
curl -I https://yourdomain.com/assets/index-abc123.js
```

6. **Fix try_files directive (SPA routing):**
If you're getting 404s on routes, the `try_files` syntax might need adjustment. Try this corrected version:

```
yourdomain.com {
    root * /path/to/your/landing/dist
    file_server
    
    # For SPA routing - this ensures all routes serve index.html
    @notFound {
        file {
            try_files {path} {path}/ /index.html
        }
    }
    rewrite @notFound /index.html
}
```

Or use this simpler approach:
```
yourdomain.com {
    root * /path/to/your/landing/dist
    
    # Try the requested path, then try as directory, then fallback to index.html
    try_files {path} {path}/ /index.html
    
    file_server
}
```

7. **Check SELinux (if enabled on Amazon Linux):**
```bash
# Check if SELinux is blocking access
sudo getenforce

# If enforcing, you may need to set context
sudo chcon -R -t httpd_sys_content_t /path/to/your/landing/dist
```

8. **Verify Caddy can read the directory:**
```bash
# Test as caddy user
sudo -u caddy ls -la /path/to/your/landing/dist

# If this fails, fix ownership
sudo chown -R caddy:caddy /path/to/your/landing/dist
```

9. **Check for syntax errors in Caddyfile:**
```bash
# Validate Caddyfile syntax
sudo caddy validate --config /etc/caddy/Caddyfile

# If validation fails, check for:
# - Missing braces
# - Incorrect directive names
# - Path issues
```

10. **Alternative working Caddyfile for static files:**
If nothing works, try this tested configuration:

```
yourdomain.com {
    # Use absolute path
    root * /home/ubuntu/tofulu/landing/dist
    
    # Enable file server
    file_server
    
    # Try files with fallback to index.html for SPA routing
    try_files {path} /index.html
}
```

11. **Run diagnostic script:**
Create and run this script to check everything:

```bash
#!/bin/bash
# Save as: check-caddy-static.sh

echo "=== Caddy Static Files Diagnostic ==="
echo ""

# Check Caddy service
echo "1. Checking Caddy service status..."
sudo systemctl status caddy --no-pager -l | head -10
echo ""

# Check Caddyfile syntax
echo "2. Validating Caddyfile..."
sudo caddy validate --config /etc/caddy/Caddyfile
echo ""

# Check dist folder
echo "3. Checking dist folder..."
DIST_PATH=$(sudo grep -oP 'root \* \K[^\s]+' /etc/caddy/Caddyfile | head -1)
if [ -n "$DIST_PATH" ]; then
    echo "   Dist path from Caddyfile: $DIST_PATH"
    echo "   Path exists: $([ -d "$DIST_PATH" ] && echo "YES" || echo "NO")"
    echo "   Index.html exists: $([ -f "$DIST_PATH/index.html" ] && echo "YES" || echo "NO")"
    echo "   Permissions:"
    ls -ld "$DIST_PATH" 2>/dev/null || echo "   Cannot access path"
    echo "   Contents:"
    ls -la "$DIST_PATH" 2>/dev/null | head -5 || echo "   Cannot list contents"
else
    echo "   Could not find dist path in Caddyfile"
fi
echo ""

# Check Caddy logs
echo "4. Recent Caddy errors:"
sudo journalctl -u caddy -n 20 --no-pager | grep -i error || echo "   No errors found"
echo ""

# Check file permissions
echo "5. File ownership (should be readable by caddy user):"
if [ -n "$DIST_PATH" ] && [ -d "$DIST_PATH" ]; then
    sudo -u caddy test -r "$DIST_PATH/index.html" && echo "   ✓ Caddy can read index.html" || echo "   ✗ Caddy CANNOT read index.html"
fi
echo ""

echo "=== Diagnostic Complete ==="
```

Make it executable and run:
```bash
chmod +x check-caddy-static.sh
./check-caddy-static.sh
```

### Caddy Issues

**Caddy won't start:**
```bash
# Validate configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Check logs
sudo journalctl -u caddy -n 50

# Check if port 80/443 are already in use
sudo netstat -tulpn | grep -E ':(80|443)'
```

**Certificate issues:**
- Ensure your domain DNS points to the server's IP
- Check that ports 80 and 443 are open in your security group
- Verify domain is accessible: `curl -I http://yourdomain.com`

### Backend Issues

**Backend won't start:**
```bash
# Check service status
sudo systemctl status testino-backend

# View detailed logs
sudo journalctl -u testino-backend -n 100

# Test backend manually
cd /path/to/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

**Backend not accessible:**
- Verify backend is listening on `0.0.0.0:8080`: `sudo netstat -tulpn | grep 8080`
- Check firewall rules: `sudo ufw status`
- Test local connection: `curl http://localhost:8080/api/v1/health`

**Connection refused from Caddy:**
- Ensure backend is running: `sudo systemctl status testino-backend`
- Verify backend is listening on `0.0.0.0:8080` (not just `127.0.0.1:8080`)
- Check backend logs for errors

### General Issues

**Check all services:**
```bash
# List all running services
sudo systemctl list-units --type=service --state=running

# Check network connections
sudo netstat -tulpn
```

**Restart services:**
```bash
# Restart Caddy
sudo systemctl restart caddy

# Restart backend
sudo systemctl restart testino-backend
```

## Security Best Practices

1. **Restrict Backend Port:** After confirming Caddy works, restrict port 8080 to localhost only in your security group
2. **Use Environment Variables:** Never commit `.env` files with secrets
3. **Keep Updated:** Regularly update system packages: `sudo apt update && sudo apt upgrade`
4. **Monitor Logs:** Set up log rotation and monitoring
5. **Firewall:** Use UFW to restrict unnecessary ports
6. **SSH Security:** Use SSH keys instead of passwords, disable root login

## Next Steps

- Set up log rotation for application logs
- Configure monitoring and alerting
- Set up automated backups
- Configure database (if needed)
- Set up Redis for OTP storage (production requirement)
- Configure email service (AWS SES, Resend, etc.)

## Caddyfile Quick Reference

### Basic Static File Server

```
example.com {
    root * /var/www/html
    file_server
}
```

### SPA (Single Page Application) with React Router

```
example.com {
    root * /var/www/dist
    file_server
    try_files {path} /index.html
}
```

### Static Files + API Proxy

```
example.com {
    root * /var/www/dist
    file_server
    try_files {path} /index.html
    
    handle /api/* {
        reverse_proxy localhost:8080
    }
}
```

### Multiple Domains

```
www.example.com {
    root * /var/www/frontend/dist
    file_server
    try_files {path} /index.html
}

api.example.com {
    reverse_proxy localhost:8080
}
```

### Custom Port (Non-Standard)

```
:8080 {
    reverse_proxy localhost:3000
}
```

### Redirect HTTP to HTTPS

```
http://example.com {
    redir https://example.com{uri} permanent
}

https://example.com {
    root * /var/www/html
    file_server
}
```

### Add Custom Headers

```
example.com {
    root * /var/www/html
    file_server
    
    header {
        X-Custom-Header "value"
        -Server  # Hide server information
    }
}
```

### Enable Compression

```
example.com {
    root * /var/www/html
    file_server
    encode gzip zstd
}
```

### Logging

```
example.com {
    root * /var/www/html
    file_server
    
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
```

## Additional Resources

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Caddyfile Syntax](https://caddyserver.com/docs/caddyfile)
- [Systemd Service Guide](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [UFW Firewall Guide](https://help.ubuntu.com/community/UFW)

