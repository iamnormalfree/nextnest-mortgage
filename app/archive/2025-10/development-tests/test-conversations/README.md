# Conversation Monitoring Page

## Overview
Real-time monitoring dashboard for Chatwoot conversations with auto-refresh capabilities.

## Access
Navigate to: `http://localhost:3000/test-conversations`

## Features

### Conversation List (Left Panel)
- Displays last 20 conversations sorted by recent activity
- Shows:
  - Contact name and email
  - Conversation ID and status
  - Assigned broker (AI or human)
  - Message count
  - Lead score (if available)
  - Last message timestamp and preview
- Click any conversation to view details

### Conversation Details (Right Panel)
- Full conversation metadata
- All messages with:
  - Sender name and type
  - Message type (incoming/outgoing/activity)
  - Timestamp
  - Private/public indicator
  - Full message content

### Auto-Refresh
- Auto-refreshes every 10 seconds (toggle on/off)
- Manual refresh button available
- Refreshes both list and active conversation

## Status Colors
- **Open** (green/emerald): Active with human agent
- **Pending** (gold): Awaiting assignment
- **Bot** (gold-pale): Being handled by AI broker
- **Resolved** (gray/graphite): Closed conversation

## Environment Variables Required
Ensure these are set in your `.env.local`:

```bash
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_API_TOKEN=your_api_token_here
CHATWOOT_ACCOUNT_ID=1
```

## API Endpoints Used

### GET /api/test-conversations
Returns list of 20 most recent conversations

**Response:**
```json
{
  "success": true,
  "conversations": [...],
  "total": 20
}
```

### GET /api/test-conversations?id={conversationId}
Returns full conversation details with all messages

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": 123,
    "messages": [...],
    ...
  }
}
```

## Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Monitoring Page
Open browser to: `http://localhost:3000/test-conversations`

### 3. Verify Functionality
- [ ] Conversations load successfully
- [ ] Clicking a conversation shows details
- [ ] Messages display correctly
- [ ] Status badges show correct colors
- [ ] Auto-refresh works (check console for refresh logs)
- [ ] Manual refresh button works
- [ ] Responsive design works on mobile

### 4. Test Error Handling
- Temporarily break API token to see error message
- Check network tab for API calls
- Verify graceful degradation

## Design System
Uses NextNest Bloomberg-inspired design tokens:
- **Colors**: ink, charcoal, graphite, silver, pearl, fog, mist, gold, emerald, ruby
- **Components**: Shadcn UI (Card, Badge, Button)
- **Typography**: SF font family
- **Spacing**: 8px base unit system
- **No border radius**: Sharp, terminal-style design

## Mobile Responsive
- Single column layout on mobile
- Conversation list above details
- Touch-friendly tap targets
- Scrollable message areas

## Performance
- Fetches only 20 most recent conversations
- Parallel API calls for conversation + messages
- Efficient re-rendering with React state
- 10-second refresh interval (configurable)

## Troubleshooting

### "Failed to fetch conversations"
- Check CHATWOOT_API_TOKEN is valid
- Verify CHATWOOT_BASE_URL is correct
- Check network connectivity to Chatwoot instance

### "No conversations found"
- Chatwoot instance may not have conversations yet
- Check API response in browser network tab
- Verify account ID matches your Chatwoot setup

### Auto-refresh not working
- Check browser console for errors
- Verify component mounted successfully
- Try manual refresh button

## Future Enhancements
- Filter by status, broker, date range
- Search conversations by contact name/email
- Export conversation transcripts
- Real-time updates via WebSocket
- Conversation analytics and metrics
