# Authentication for Apps SDK

## Overview

The documentation covers authentication patterns for Apps SDK applications, focusing on two primary approaches:

### 1. Custom OAuth 2.1 Authentication

Key components of the OAuth flow:
- **Resource server**: MCP server exposing tools and verifying access tokens
- **Authorization server**: Identity provider issuing tokens
- **Client**: ChatGPT acting on behalf of the user

#### Required Endpoints
- `/.well-known/oauth-protected-resource`
- `/.well-known/openid-configuration`
- `token_endpoint`
- `registration_endpoint`

#### Authentication Flow
1. ChatGPT queries MCP server for resource metadata
2. Client registers with authorization server
3. User authenticates and consents to scopes
4. Exchange authorization code for access token
5. Server verifies token on each request

### 2. Per-Tool Authentication with `securitySchemes`

Authentication can be defined at the tool level with two primary scheme types:
- "noauth": Callable anonymously
- "oauth2": Requires OAuth 2.0 with optional scopes

#### Example Code Snippets

Public Search Tool:
```typescript
server.registerTool(
  "search",
  {
    securitySchemes: [
      { type: "noauth" },
      { type: "oauth2", scopes: ["search.read"] },
    ],
    // Tool implementation
  }
);
```

Create Document Tool (Auth Required):
```typescript
server.registerTool(
  "create_doc",
  {
    securitySchemes: [{ type: "oauth2", scopes: ["docs.write"] }],
    // Tool implementation
  }
);
```

## Recommendations

- Keep server discoverable
- Enforce authentication per tool call
- Plan for token rotation and revocation
- Start with development tenant for testing
- Gradually roll out to trusted testers

## Related Links

- [Previous: Build a Custom UX](/apps-sdk/build/custom-ux)
- [Next: Persist State](/apps-sdk/build/storage)
