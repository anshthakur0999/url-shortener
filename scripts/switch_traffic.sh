#!/bin/bash
set -e

# Script to switch Nginx traffic from Green to Blue
# This is the actual blue-green deployment traffic switch

BLUE_PORT=3001
GREEN_PORT=3002

echo "🔀 Switching traffic from Green to Blue..."

# Create Nginx config for Blue container
NGINX_CONF="/etc/nginx/sites-available/url-shortener"
NGINX_ENABLED="/etc/nginx/sites-enabled/url-shortener"

echo "📝 Creating Nginx configuration..."

sudo tee "$NGINX_CONF" > /dev/null <<EOF
upstream url_shortener {
    server localhost:$BLUE_PORT max_fails=3 fail_timeout=10s;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://url_shortener;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /api/health {
        proxy_pass http://url_shortener;
        access_log off;
    }
}
EOF

# Enable site if not already enabled
if [ ! -f "$NGINX_ENABLED" ]; then
  echo "🔗 Enabling Nginx site..."
  sudo ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
fi

# Test Nginx configuration
echo "✅ Testing Nginx configuration..."
sudo nginx -t || {
  echo "❌ Nginx configuration test failed"
  exit 1
}

# Reload Nginx
echo "♻️  Reloading Nginx..."
sudo systemctl reload nginx || {
  echo "❌ Failed to reload Nginx"
  exit 1
}

echo "✅ Traffic successfully switched to Blue container!"
echo "Nginx is now routing to port $BLUE_PORT"
