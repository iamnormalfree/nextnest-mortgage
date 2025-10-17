# Authentication

## Authenticate your users

Many Apps SDK apps can operate anonymously, but user-specific or write-action features require authentication. You can integrate with your own authorization server for backend connections.

## Custom auth with OAuth 2.1

When connecting to external systems, you can implement a full OAuth 2.1 flow that follows the MCP authorization specification.

### Components

- **Resource server**: Your MCP server that exposes tools and verifies access tokens
- **Authorization server**: Identity provider that issues tokens
- **Client**: ChatGPT acting on behalf of the user

### Required endpoints

Your authorization server must provide:

- `/.well-known/oauth-protected-resource`: Lists authorization servers and required scopes
- `/.well-known/openid-configuration`: Discovery document
- `token_endpoint`: Accepts code+PKCE exchanges
- `registration_endpoint`: Accepts dynamic client registration

### Flow in practice

1. ChatGPT queries MCP server for resource metadata
2. ChatGPT registers with authorization server
3. User authenticates and consents to scopes
4. ChatGPT exchanges authorization code for access token
5. Server verifies token on each request

### Implementing verification

Example Python implementation:

```python
from mcp.server.fastmcp import FastMCP
from mcp.server.auth.settings import AuthSettings
from mcp.server.auth.provider import TokenVerifier, AccessToken

class MyVerifier(TokenVerifier):
    async def verify_token(self, token: str) -> AccessToken | None:
        payload = validate_jwt(token, jwks_url)
        if "user" not in payload.get("permissions", []):
            return None
        return AccessToken(
            token=token,
            client_id=payload["azp"],
            subject=payload["sub"],
            scopes=payload.get("permissions", []),
            claims=payload,
        )

mcp = FastMCP(
    name="kanban-mcp",
    stateless_http=True,
    token_verifier=MyVerifier(),
    auth=AuthSettings(
        issuer_url="https://your-tenant.us.auth0.com",
        resource_server_url="https://your-server.example.com",
        scopes=["user", "write:tasks"]
    )
)
```

## Best Practices

- Use PKCE for security
- Validate all tokens on server side
- Request only necessary scopes
- Implement proper error handling
- Log authentication events for monitoring

## Related Links

- [Previous: Build a Custom UX](/apps-sdk/build/custom-ux)
- [Next: Persist State](/apps-sdk/build/storage)
