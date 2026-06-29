# RTRS Production Deployment Guide - Debian (IP-based)

## Prerequisites

- Debian 11+ server
- Root/sudo access
- MySQL/MariaDB database
- Node.js 18+
- PM2 (`npm install -g pm2`)
- Apache with `proxy`, `proxy_http`, `proxy_wstunnel`, `rewrite`, `headers` modules

---

## 1. Install System Dependencies

```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Apache with required modules
sudo apt install -y apache2
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers
sudo systemctl restart apache2
```

---

## 2. Configure MySQL

```bash
sudo mysql_secure_installation

sudo mysql -u root -p
```

```sql
CREATE DATABASE rtrs_production;
CREATE USER 'rtrs_user'@'localhost' IDENTIFIED BY 'secure-password';
GRANT ALL PRIVILEGES ON rtrs_production.* TO 'rtrs_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Deploy Application

```bash
git clone https://github.com/kjsanni/restaurant-table-reservation-system.git /var/www/rtrs
cd /var/www/rtrs

sudo chown -R $USER:$USER /var/www/rtrs
chmod +x deploy-prod.sh
./deploy-prod.sh
```

The `deploy-prod.sh` script:
- Installs dependencies for backend and frontend
- Runs database migrations
- Seeds default roles, groups, and admin user
- Performs rollback on migration failure

---

## 4. Configure Environment Variables

```bash
cd /var/www/rtrs/back-end
cp .env.production.example .env
nano .env
```

```env
# CRITICAL: Generate with `openssl rand -hex 32`
JWT_SECRET=your-generated-256-bit-secret-here

DB_HOST=localhost
DB_USER=rtrs_user
DB_PASSWORD=secure-password
DB_NAME=rtrs_production
PORT=8000

# CORS: Set your actual domain(s), comma-separated
CORS_ORIGINS=https://yourdomain.com

# App
NODE_ENV=production
APP_NAME=RTRS
```

```bash
# Frontend env (optional)
cd /var/www/rtrs/front-end
cp .env.production .env
```

---

## 5. PM2 Configuration

The project includes `ecosystem.config.js` for PM2:

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### PM2 Features
- Cluster mode (max instances based on CPU cores)
- Auto-restart on crash
- Log rotation
- Environment-specific configs

---

## 6. Configure Apache for IP Access

```bash
sudo a2ensite rtrs-ip.conf
sudo systemctl reload apache2
```

If not exists, create it:
```bash
sudo tee /etc/apache2/sites-available/rtrs-ip.conf > /dev/null << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    ServerAlias *

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"

    # Backend API
    ProxyPreserveHost On
    ProxyPass /api http://localhost:8000/api nocanon
    ProxyPassReverse /api http://localhost:8000/api

    # WebSocket support (Socket.io)
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteRule /(.*) ws://localhost:8000/$1 [P,L]

    # Frontend (served by PM2/Nginx or Vite preview)
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/

    ErrorLog ${APACHE_LOG_DIR}/rtrs-error.log
    CustomLog ${APACHE_LOG_DIR}/rtrs-access.log combined
</VirtualHost>
EOF
```

For Nginx, use `nginx-production.conf` in the project root.

---

## 7. Seed Database

```bash
cd /var/www/rtrs/back-end
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

This seeds:
- Default roles: `admin`, `manager`, `staff`
- Default groups: `Front of House`, `Kitchen`, `Management`, `waiting_staff`
- Default schedule templates
- Initial admin user (`admin@rtrs.com` / `admin123`)

---

## 8. Firewall Setup

```bash
sudo ufw allow 80/tcp
sudo ufw allow ssh
sudo ufw --force enable
```

---

## 9. Access Application

After deployment, access via:
- `http://YOUR_SERVER_IP/` - Main application
- `http://YOUR_SERVER_IP/api/v1` - API endpoints
- `http://YOUR_SERVER_IP/api/v1/stats` - Performance metrics
- `http://YOUR_SERVER_IP/api/v1/health` - Health check

**⚠️ Change default admin credentials immediately!**

---

## 10. Maintenance Commands

```bash
# Check PM2 services
pm2 list

# View logs
pm2 logs

# Restart all
pm2 restart all

# Update application
cd /var/www/rtrs && git pull && ./deploy-prod.sh
```

---

## Security Notes

1. **JWT Secret**: Generate with `openssl rand -hex 32`. Never use the default.
2. **CORS**: Set `CORS_ORIGINS` to your actual domain(s) in production.
3. **Database**: Use strong passwords. Never expose MySQL to public internet.
4. **Admin Credentials**: Change after first login.
5. **Firewall**: Only expose ports 80/443. Keep SSH restricted.
6. **HTTPS**: Configure SSL certificate (Let's Encrypt) for production.

---

## Testing in Production

```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health

# Test CSRF token
curl http://localhost:8000/api/v1/csrf-token

# Test with credentials (must set cookie)
curl -c cookies.txt -b cookies.txt http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rtrs.com","password":"admin123"}'

# Get CSRF token from cookie and test protected route
XSRF_TOKEN=$(grep XSRF-TOKEN cookies.txt | awk '{print $7}')
curl -c cookies.txt -b cookies.txt \
  -H "x-xsrf-token: $XSRF_TOKEN" \
  http://localhost:8000/api/v1/reservations
```
