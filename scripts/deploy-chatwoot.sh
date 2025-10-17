#!/bin/bash
# Chatwoot Docker Deployment Script for VPS/Hetzner
# Requires: Ubuntu 20.04+ with Docker installed

# Configuration
DOMAIN="chat.nextnest.sg"
EMAIL="admin@nextnest.sg"

echo "🚀 Chatwoot Deployment Script"
echo "=============================="

# Step 1: Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Step 2: Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Step 3: Create Chatwoot directory
mkdir -p ~/chatwoot
cd ~/chatwoot

# Step 4: Download Chatwoot Docker files
echo "Downloading Chatwoot configuration..."
wget https://raw.githubusercontent.com/chatwoot/chatwoot/develop/docker-compose.production.yaml
wget https://raw.githubusercontent.com/chatwoot/chatwoot/develop/.env.example -O .env

# Step 5: Configure environment
echo "Configuring environment..."
sed -i "s/FRONTEND_URL=.*/FRONTEND_URL=https:\/\/$DOMAIN/" .env
sed -i "s/SECRET_KEY_BASE=.*/SECRET_KEY_BASE=$(openssl rand -hex 64)/" .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 32)/" .env
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$(openssl rand -hex 32)/" .env

# Step 6: Start Chatwoot
echo "Starting Chatwoot..."
docker-compose -f docker-compose.production.yaml up -d

# Step 7: Run database migrations
echo "Running database migrations..."
sleep 10
docker-compose -f docker-compose.production.yaml run --rm rails bundle exec rails db:chatwoot_prepare

# Step 8: Create super admin
echo "Creating super admin user..."
docker-compose -f docker-compose.production.yaml run --rm rails bundle exec rails db:seed

echo ""
echo "✅ Chatwoot deployed successfully!"
echo "=================================="
echo "Access at: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Next steps:"
echo "1. Set up reverse proxy (nginx/caddy) for SSL"
echo "2. Point $DOMAIN to this server"
echo "3. Access Chatwoot and complete setup"