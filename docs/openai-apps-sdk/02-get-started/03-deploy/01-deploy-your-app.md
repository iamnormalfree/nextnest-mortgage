# Deploy your app

## Deployment Options

When deploying an MCP server, consider these hosting platforms:

### Recommended Platforms
- **Managed containers**:
  - Fly.io
  - Render
  - Railway (quick setup with automatic TLS)

- **Cloud serverless**:
  - Google Cloud Run
  - Azure Container Apps
  - Note: Be cautious of cold starts affecting streaming HTTP

- **Kubernetes**:
  - Ideal for teams with existing clusters
  - Use an ingress controller supporting server-sent events

### Key Deployment Requirements
- Keep `/mcp` endpoint responsive
- Support streaming responses
- Return appropriate HTTP status codes for errors

## Local Development

Use ngrok to expose local server to ChatGPT:

```bash
ngrok http 2091
# https://<subdomain>.ngrok.app/mcp → http://127.0.0.1:2091/mcp
```

Development workflow:
1. Rebuild component bundle (`npm run build`)
2. Restart MCP server
3. Refresh connector in ChatGPT settings

## Environment Configuration

- **Secrets**: Use platform-specific secret managers
- **Logging**:
  - Log tool-call IDs
  - Track request latency
  - Capture error payloads
- **Observability**: Monitor CPU, memory, and request counts

## Dogfood and Rollout

Pre-launch steps:
1. Gate access (use developer mode or experiment flags)
2. Run "golden prompts"
3. Capture artifacts and screenshots

## Next Steps

- [Connect to ChatGPT](/apps-sdk/deploy/connect-chatgpt)
- [Test Integration](/apps-sdk/deploy/testing)
- [Troubleshooting Guide](/apps-sdk/deploy/troubleshooting)
