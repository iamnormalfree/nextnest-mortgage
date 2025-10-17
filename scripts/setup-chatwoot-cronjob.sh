#!/bin/bash
# Setup cron job for Chatwoot conversation auto-fix
# This creates a cron job that runs every 5 minutes

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCRIPT_PATH="$SCRIPT_DIR/auto-fix-chatwoot-conversations.js"
LOG_PATH="$SCRIPT_DIR/logs/chatwoot-autofix.log"

echo "🔧 Setting up cron job for Chatwoot auto-fix..."
echo "Script: $SCRIPT_PATH"
echo "Log: $LOG_PATH"

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Make script executable
chmod +x "$SCRIPT_PATH"

# Create cron job entry
CRON_COMMAND="*/5 * * * * cd \"$PROJECT_DIR\" && node \"$SCRIPT_PATH\" >> \"$LOG_PATH\" 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
    echo "⚠️ Cron job already exists. Removing old one..."
    crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | crontab -
fi

# Add new cron job
echo "📝 Adding cron job..."
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Successfully added cron job!"
    echo "📝 Job will run every 5 minutes"
    echo "📄 Logs will be written to: $LOG_PATH"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "$SCRIPT_PATH"
    echo ""
    echo "To manage the cron job:"
    echo "  View:   crontab -l"
    echo "  Edit:   crontab -e"
    echo "  Remove: crontab -l | grep -v '$SCRIPT_PATH' | crontab -"
    echo ""
    echo "🧪 Testing script now..."
    cd "$PROJECT_DIR"
    node "$SCRIPT_PATH"
else
    echo "❌ Failed to add cron job"
fi