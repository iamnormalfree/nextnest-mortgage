---
title: deployment-env-variables
type: runbook
domain: devops
owner: ops
last-reviewed: 2025-09-30
---

# NextNest Production Deployment Environment Variables

## Required Environment Variables

These variables MUST be configured for production deployment:

### Core Configuration
- `NODE_ENV` - Set to `production` for production deployment
- `NEXT_PUBLIC_BASE_URL` - Full URL of your production site (e.g., https://nextnest.sg)
- `NEXT_PUBLIC_SITE_URL` - Site URL for CORS and sitemap generation

### Chatwoot Integration (Required for Chat Features)
- `CHATWOOT_BASE_URL` - Your Chatwoot instance URL (without trailing slash)
- `CHATWOOT_API_TOKEN` - API token from Chatwoot Super Admin dashboard
- `CHATWOOT_ACCOUNT_ID` - Account ID from Chatwoot
- `CHATWOOT_INBOX_ID` - Inbox ID for website channel
- `CHATWOOT_WEBSITE_TOKEN` - Website token from inbox settings
- `NEXT_PUBLIC_CHATWOOT_CHAT_URL` - Public Chatwoot URL for widget

### Security
- `ENCRYPTION_KEY` - 32-byte hex key for sensitive data encryption (generate with: `openssl rand -hex 32`)

## Optional Environment Variables

### AI Features
- `OPENAI_API_KEY` - OpenAI API key for AI-powered chat responses (optional, falls back to template responses)

### Feature Flags
- `NEXT_PUBLIC_USE_INTELLIGENT_FORM` - Set to `true` to use intelligent form on landing (default: true)
- `ENABLE_CHAT_TRANSITION` - Enable chat transition feature (default: true)
- `ENABLE_AI_BROKER` - Enable AI broker features (default: true)
- `ENABLE_ANALYTICS` - Enable analytics tracking (default: true)

### Fallback Configuration
- `CHAT_FALLBACK_PHONE` - Phone number when chat is unavailable (e.g., +6583341445)
- `CHAT_FALLBACK_EMAIL` - Email when chat is unavailable (e.g., assist@nextnest.sg)

### Circuit Breaker (for resilience)
- `CIRCUIT_BREAKER_FAILURE_THRESHOLD` - Failures before circuit opens (default: 5)
- `CIRCUIT_BREAKER_TIMEOUT` - Reset timeout in ms (default: 60000)
- `CIRCUIT_BREAKER_STATE` - Current state (managed by system, default: CLOSED)

### Monitoring & Observability
- `LANGFUSE_PUBLIC_KEY` - Langfuse analytics public key
- `LANGFUSE_SECRET_KEY` - Langfuse analytics secret key
- `LANGFUSE_BASE_URL` - Langfuse analytics base URL
- `SENTRY_DSN` - Sentry error tracking DSN (optional)
- `DATADOG_API_KEY` - Datadog APM key (optional)

### API Configuration
- `API_RATE_LIMIT` - Requests per minute limit (default: 100)
- `API_TIMEOUT` - API timeout in milliseconds (default: 30000)

### Compliance
- `PDPA_COMPLIANCE_MODE` - PDPA compliance level: `strict` or `standard` (default: strict)
- `DATA_RETENTION_DAYS` - Data retention period (default: 90)
- `AUDIT_LOG_ENABLED` - Enable audit logging (default: true)

### Development/Testing
- `DEBUG` - Enable debug logging (set to `false` in production)
- `MOCK_CHATWOOT` - Mock Chatwoot responses for testing (set to `false` in production)

### External Integrations
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` - n8n webhook URL for workflow automation (if using n8n)

## Environment Variable Validation

Before deploying, verify all required variables are set:

```bash
# Check if all required variables are present
node -e "
const required = [
  'NODE_ENV',
  'NEXT_PUBLIC_BASE_URL',
  'CHATWOOT_BASE_URL',
  'CHATWOOT_API_TOKEN',
  'CHATWOOT_ACCOUNT_ID',
  'CHATWOOT_INBOX_ID',
  'CHATWOOT_WEBSITE_TOKEN',
  'NEXT_PUBLIC_CHATWOOT_CHAT_URL',
  'ENCRYPTION_KEY'
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
} else {
  console.log('All required environment variables are set!');
}
"
```

## Security Best Practices

1. **Never commit** `.env.local` or any file containing actual values
2. **Use strong, unique values** for all secrets and API keys
3. **Rotate keys regularly** - at least every 90 days
4. **Different values** for staging and production environments
5. **Encrypt sensitive values** in CI/CD systems
6. **Restrict access** to production environment variables
7. **Audit access logs** to environment variable stores

## Platform-Specific Setup

### Vercel
```bash
vercel env add CHATWOOT_API_TOKEN production
vercel env add ENCRYPTION_KEY production
# Add all other variables...
```

### Netlify
Add variables in Site Settings > Environment variables

### Docker
Use `docker-compose.yml` with env_file:
```yaml
env_file:
  - .env.production
```

### Kubernetes
Use Secrets and ConfigMaps:
```bash
kubectl create secret generic nextnest-secrets \
  --from-literal=CHATWOOT_API_TOKEN=xxx \
  --from-literal=ENCRYPTION_KEY=xxx
```

## Troubleshooting

### Missing API Keys
- Check build logs for "Missing credentials" errors
- Verify environment variables are accessible during build
- Some platforms require `NEXT_PUBLIC_` prefix for client-side variables

### CORS Issues
- Ensure `NEXT_PUBLIC_SITE_URL` matches your production domain
- Check `Access-Control-Allow-Origin` headers in API routes

### Chat Widget Not Loading
- Verify `NEXT_PUBLIC_CHATWOOT_CHAT_URL` is accessible
- Check browser console for CSP (Content Security Policy) errors
- Ensure `CHATWOOT_WEBSITE_TOKEN` matches your inbox configuration

### Build Failures
- OpenAI API key is optional - build will succeed without it
- Check for TypeScript errors with `npm run build`
- Verify all imports resolve correctly

## Contact for Support
For deployment assistance, contact the technical team or refer to the deployment guide.