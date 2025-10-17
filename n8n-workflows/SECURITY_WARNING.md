# ⚠️ SECURITY WARNING - n8n Workflow Credentials

## Status: ✅ CLEANED (2025-10-01)

All hardcoded Chatwoot API tokens have been removed from workflow JSON files.

## Previous Security Issue (RESOLVED)

**What was wrong**: Workflow files contained hardcoded Chatwoot API token in plaintext.

**What was fixed** (2025-10-01):
- 4 workflow files cleaned: 25 hardcoded token instances replaced
- Now use n8n environment variable syntax: `={{$env.CHATWOOT_API_TOKEN}}`

## Files Cleaned

1. `NN AI Broker - Updated.json` - 7 instances removed
2. `NN AI Broker - Updated v2.json` - 6 instances removed
3. `chatwoot-conversation-enhancer.json` - 6 instances removed
4. `Chatwoot Conversation Enhancer v2.json` - 6 instances removed

**Total: 25 hardcoded credentials removed**

## Required Actions Before Deployment

### 1. Import Workflow to n8n
- Import the JSON file into your n8n instance

### 2. Update All HTTP Request Nodes
For each HTTP Request node that accesses Chatwoot API:

**Before (Hardcoded):**
```json
{
  "headerParameters": {
    "parameters": [{
      "name": "Api-Access-Token",
      "value": "ML1DyhzJyDKFFvsZLvEYfHnC"
    }]
  }
}
```

**After (Using Credentials):**
```json
{
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "credentials": {
    "httpHeaderAuth": {
      "id": "your-credential-id",
      "name": "Chatwoot API Header Auth"
    }
  }
}
```

### 3. Create n8n Credentials
1. Go to n8n → Credentials → New
2. Select "Header Auth"
3. Configure:
   - Name: `Chatwoot API Header Auth`
   - Header Name: `Api-Access-Token`
   - Header Value: `[your-actual-token]`
4. Save the credential

### 4. Update URL Parameters
Replace hardcoded account IDs in URLs:
- **Before**: `https://chat.nextnest.sg/api/v1/accounts/1/conversations`
- **After**: `https://chat.nextnest.sg/api/v1/accounts/{{$env.CHATWOOT_ACCOUNT_ID}}/conversations`

### 5. Use Environment Variables
Set these in your n8n instance:
```bash
CHATWOOT_BASE_URL=https://chat.nextnest.sg
CHATWOOT_ACCOUNT_ID=your-account-id
CHATWOOT_INBOX_ID=your-inbox-id
```

## Security Best Practices

1. **Never commit credentials**: Use .gitignore for files with secrets
2. **Use credential management**: Leverage n8n's built-in credential system
3. **Rotate tokens regularly**: Change API tokens periodically
4. **Limit token scope**: Use tokens with minimal required permissions
5. **Monitor access**: Track which workflows use which credentials

## Verification Checklist

Before activating any workflow:
- [ ] All HTTP Request nodes use credential references
- [ ] No hardcoded tokens in workflow JSON
- [ ] Environment variables configured
- [ ] Credentials tested and working
- [ ] Production tokens different from development

## Support

If you need help updating credentials:
1. Review n8n credential documentation: https://docs.n8n.io/credentials/
2. Test workflows in development environment first
3. Monitor execution logs for authentication errors

---

**Last Updated**: 2025-10-01
**Security Audit**: This warning was generated as part of a comprehensive security cleanup.
