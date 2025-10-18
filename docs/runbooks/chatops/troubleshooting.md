# Chatwoot Self-Hosted on Hetzner - Configuration Guide

## 🔍 Finding Your Configuration Values

### Step 1: Access Your Hetzner Server
```bash
ssh root@your-hetzner-ip
# or
ssh your-user@chat.nextnest.sg
```

### Step 2: Get Account ID and Inbox ID

#### If installed with chatwoot-ctl:
```bash
# Navigate to Chatwoot directory
cd /home/chatwoot/chatwoot

# Access Rails console
sudo -u chatwoot RAILS_ENV=production bundle exec rails console

# In Rails console:
Account.first.id  # This is your CHATWOOT_ACCOUNT_ID
Inbox.first.id    # This is your CHATWOOT_INBOX_ID
Channel::WebWidget.first.website_token  # Verify website token
User.first.access_token.token  # Get an API token
exit
```

#### If installed with Docker:
```bash
# List containers
docker ps

# Access Rails console
docker exec -it chatwoot_rails_1 bundle exec rails console

# Same commands as above
Account.first.id
Inbox.first.id
```

### Step 3: Get/Create API Token

#### Option A: Via Web UI
1. Login to your Chatwoot at `https://chat.nextnest.sg`
2. Click profile icon (top right)
3. Go to "Profile Settings"
4. Click "Access Token"
5. Copy the token

#### Option B: Via Rails Console
```bash
# Access Rails console (as shown above)
user = User.find_by(email: 'your-admin@email.com')
token = user.access_tokens.create!(token: SecureRandom.hex(16))
puts "Your API Token: #{token.token}"
```

## 🔧 Common Configuration Issues

### Issue 1: 401 Authentication Failed
**Your current error indicates the API token is invalid.**

**Solution:**
```bash
# SSH into your server
ssh root@your-hetzner-ip

# Get a valid API token
cd /home/chatwoot/chatwoot
sudo -u chatwoot RAILS_ENV=production bundle exec rails console

# Create new token for your admin user
user = User.find_by(email: 'assist@nextnest.sg')  # Use your actual admin email
token = user.access_tokens.create!
puts "New API Token: #{token.token}"
exit

# Update your .env.local with this new token
```

### Issue 2: Cannot Connect to API
**Check if Chatwoot is running:**
```bash
# Check service status
sudo systemctl status chatwoot.target

# Or for Docker
docker ps | grep chatwoot

# Test locally on server
curl http://localhost:3000/api
# Should return: {"version":"2.x.x"}
```

### Issue 3: SSL/HTTPS Issues
**Check your reverse proxy:**
```bash
# For Nginx
sudo nano /etc/nginx/sites-available/chatwoot
# Make sure proxy_pass points to http://localhost:3000

# For Caddy
sudo nano /etc/caddy/Caddyfile
# Should have:
# chat.nextnest.sg {
#     reverse_proxy localhost:3000
# }

# Restart reverse proxy
sudo systemctl restart nginx  # or caddy
```

## 📝 Correct Environment Variables

Once you have the correct values, update your `.env.local`:

```env
# For self-hosted on Hetzner
CHATWOOT_BASE_URL=https://chat.nextnest.sg  # Your actual domain
# OR if no domain yet:
# CHATWOOT_BASE_URL=http://your-hetzner-ip:3000

# Get this from Rails console
CHATWOOT_API_TOKEN=your-actual-token-from-console

# Usually 1 for first installation
CHATWOOT_ACCOUNT_ID=1

# Usually 1 for first inbox
CHATWOOT_INBOX_ID=1

# Already correct from your screenshot
CHATWOOT_WEBSITE_TOKEN=t7f8JA6rDZ4pPJg3qzf6ALAY
```

## 🧪 Testing Your Configuration

### Test 1: Direct API Test
```bash
# From your local machine
curl -H "api_access_token: YOUR_TOKEN" \
  https://chat.nextnest.sg/api/v1/accounts/1/inboxes

# Should return JSON with inbox data
```

### Test 2: Check from Server
```bash
# SSH into Hetzner
ssh root@your-server

# Test locally
curl -H "api_access_token: YOUR_TOKEN" \
  http://localhost:3000/api/v1/accounts/1/inboxes

# If this works but external doesn't, it's a firewall/proxy issue
```

### Test 3: Check Firewall
```bash
# On Hetzner server
sudo ufw status
# Make sure ports 80, 443 are open

# Or check iptables
sudo iptables -L -n
```

## 🚀 Quick Fix Script

Save and run this on your Hetzner server:

```bash
#!/bin/bash
# quick-fix-chatwoot.sh

echo "Chatwoot Self-Hosted Quick Fix"
echo "=============================="

# Check if Chatwoot is running
if systemctl is-active --quiet chatwoot.target; then
    echo "✅ Chatwoot is running"
else
    echo "❌ Chatwoot is not running"
    echo "Starting Chatwoot..."
    sudo systemctl start chatwoot.target
fi

# Get configuration
echo ""
echo "Your configuration values:"
echo "========================="

cd /home/chatwoot/chatwoot
sudo -u chatwoot RAILS_ENV=production bundle exec rails runner "
  account = Account.first
  inbox = Inbox.first
  widget = Channel::WebWidget.first
  user = User.first
  token = user.access_tokens.first_or_create!
  
  puts 'CHATWOOT_ACCOUNT_ID=' + account.id.to_s
  puts 'CHATWOOT_INBOX_ID=' + inbox.id.to_s
  puts 'CHATWOOT_WEBSITE_TOKEN=' + widget.website_token.to_s
  puts 'CHATWOOT_API_TOKEN=' + token.token.to_s
"

echo ""
echo "Copy these values to your .env.local file"
```

## 🔗 Next Steps

1. Get the correct API token from your Hetzner server
2. Update your `.env.local` with the correct values
3. Run `node scripts/test-chatwoot-connection.js` again
4. Once connected, test the full integration

Need help? The issue is most likely the API token. The token "JyDKFFvsZLvEYfHnC" looks incomplete - Chatwoot tokens are usually longer.