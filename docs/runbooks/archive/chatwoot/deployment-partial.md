> **⚠️ MERGED**: This partial guide is now part of a comprehensive document.
> **Use instead**: [Chatwoot Complete Setup Guide](../../chatops/CHATWOOT_COMPLETE_SETUP_GUIDE.md)
> **Archived**: 2025-10-01
> **Reason**: Consolidated to reduce overlap and improve maintainability

[Original content below]
---

# Chatwoot Deployment & Configuration Guide

## 🚀 Quick Deployment Options

### 1. Heroku (Free Tier Available)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/chatwoot/chatwoot)

1. Click the button above
2. Create Heroku account if needed
3. Fill in app name (e.g., `nextnest-chat`)
4. Deploy (takes ~5 minutes)
5. Your URL: `https://[app-name].herokuapp.com`

### 2. Railway (Simple & Fast)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/chatwoot)

1. Click Deploy on Railway
2. Sign in with GitHub
3. Configure environment variables
4. Deploy automatically
5. Get instant URL

### 3. DigitalOcean App Platform
```bash
1. Go to https://marketplace.digitalocean.com/apps/chatwoot
2. Click "Create Chatwoot App"
3. Choose $12/month plan
4. Deploy in 1 click
```

### 4. Docker on VPS (Recommended for Production)

#### Prerequisites:
- VPS with 2GB RAM minimum (Hetzner CX21 or DigitalOcean $12 droplet)
- Ubuntu 20.04 or 22.04
- Domain pointed to server IP

#### Quick Install Commands:
```bash
# SSH into your server
ssh root@your-server-ip

# Run Chatwoot installer
wget https://get.chatwoot.app/linux/install.sh
chmod +x install.sh
./install.sh --install

# Follow prompts:
# - Enter domain: chat.nextnest.sg
# - Enter email: admin@nextnest.sg
# - Choose yes for SSL
```

## 🔍 Finding Account ID & Inbox ID

### Method 1: From URL (Easiest)

1. **Login to Chatwoot**
2. **Account ID**: Look at the URL
   ```
   https://app.chatwoot.com/app/accounts/[ACCOUNT_ID]/dashboard
   Example: https://app.chatwoot.com/app/accounts/1/dashboard
   Account ID = 1
   ```

3. **Inbox ID**: Go to Settings > Inboxes > Click on your inbox
   ```
   https://app.chatwoot.com/app/accounts/1/settings/inboxes/[INBOX_ID]/settings
   Example: https://app.chatwoot.com/app/accounts/1/settings/inboxes/2/settings
   Inbox ID = 2
   ```

### Method 2: From API

```bash
# Get Account ID
curl -H "api_access_token: YOUR_API_TOKEN" \
  https://your-chatwoot-url/api/v1/profile

# Response will include:
{
  "id": 1,
  "name": "Your Name",
  "accounts": [{
    "id": 1,  # <-- This is your Account ID
    "name": "NextNest"
  }]
}

# Get Inbox ID
curl -H "api_access_token: YOUR_API_TOKEN" \
  https://your-chatwoot-url/api/v1/accounts/1/inboxes

# Response will include:
{
  "payload": [{
    "id": 1,  # <-- This is your Inbox ID
    "name": "Website Live Chat"
  }]
}
```

### Method 3: From Database (Self-hosted)

```bash
# SSH into server
ssh root@your-server-ip

# Access Chatwoot Rails console
cd /opt/chatwoot
sudo -u chatwoot bundle exec rails console

# In console:
Account.first.id  # Returns Account ID
Inbox.first.id    # Returns Inbox ID
```

## 📝 Environment Variables Setup

Once you have your Chatwoot instance running:

1. **Get API Token**:
   - Login to Chatwoot
   - Click profile icon (top right)
   - Go to "Profile Settings"
   - Click "Access Token"
   - Copy the token

2. **Update .env.local**:
```env
# Your actual Chatwoot URL (no trailing slash)
CHATWOOT_BASE_URL=https://nextnest-chat.herokuapp.com  # or your domain

# Your API Access Token
CHATWOOT_API_TOKEN=JyDKFFvsZLvEYfHnC

# Account ID (from URL or API)
CHATWOOT_ACCOUNT_ID=1

# Inbox ID (from URL or API)
CHATWOOT_INBOX_ID=1

# Website Token (already have this)
CHATWOOT_WEBSITE_TOKEN=t7f8JA6rDZ4pPJg3qzf6ALAY
```

## 🧪 Testing Your Setup

Run this test script after configuration:

```bash
# Test API connection
curl -I -H "api_access_token: YOUR_API_TOKEN" \
  https://your-chatwoot-url/api/v1/accounts/1/inboxes

# Should return: HTTP/2 200
```

Or use our test script:
```bash
npm run test:chatwoot
# or
npx tsx scripts/test-chatwoot-backend.ts
```

## 🔧 Post-Deployment Configuration

1. **Create Website Inbox**:
   - Settings > Inboxes > Add Inbox
   - Choose "Website"
   - Name: "NextNest Live Chat"
   - Website URL: https://nextnest.sg
   - Welcome Message: "Hi! I'm your AI mortgage broker. How can I help?"

2. **Configure Webhook** (Optional):
   - Settings > Integrations > Webhooks
   - Add webhook URL: `https://nextnest.sg/api/chatwoot-webhook`
   - Select events: message_created, conversation_created

3. **Enable Features**:
   - Settings > Account Settings > Features
   - Enable: Auto-assignment, Email notifications

## 🚨 Troubleshooting

### Issue: Cannot connect to Chatwoot API
```bash
# Check if Chatwoot is running
curl https://your-chatwoot-url/api

# Should return: {"version":"2.x.x"}
```

### Issue: CORS errors
Add to Chatwoot .env:
```env
CORS_ORIGINS=https://nextnest.sg,http://localhost:3000
```

### Issue: SSL Certificate
Use Caddy for automatic SSL:
```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddyfile
sudo nano /etc/caddy/Caddyfile

# Add:
chat.nextnest.sg {
    reverse_proxy localhost:3000
}

# Restart Caddy
sudo systemctl restart caddy
```

## 📚 Resources

- [Official Docs](https://www.chatwoot.com/docs/self-hosted)
- [API Documentation](https://www.chatwoot.com/developers/api)
- [Docker Guide](https://www.chatwoot.com/docs/self-hosted/deployment/docker)
- [Heroku Guide](https://www.chatwoot.com/docs/self-hosted/deployment/heroku)
