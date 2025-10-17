# Reference

## `window.openai` Component Bridge

See [build a custom UX](/apps-sdk/build/custom-ux)

## Tool Descriptor Parameters

By default, a tool description should include fields from the Model Context Protocol specification.

### `_meta` Fields on Tool Descriptor

Required `_meta` fields:

| Key | Placement | Type | Limits | Purpose |
|-----|-----------|------|--------|---------|
| `_meta["securitySchemes"]` | Tool descriptor | array | — | Back-compat mirror for clients |
| `_meta["openai/outputTemplate"]` | Tool descriptor | string (URI) | — | Resource URI for component HTML template |
| `_meta["openai/widgetAccessible"]` | Tool descriptor | boolean | default `false` | Allow component→tool calls |
| `_meta["openai/toolInvocation/invoking"]` | Tool descriptor | string | ≤ 64 chars | Status text while tool runs |
| `_meta["openai/toolInvocation/invoked"]` | Tool descriptor | string | ≤ 64 chars | Status text after tool completes |

Example:

```javascript
server.registerTool(
  "search",
  {
    title: "Public Search",
    description: "Search public documents.",
    inputSchema: {
      type: "object",
      properties: { q: { type: "string" } },
      required: ["q"]
    },
    _meta: {
      securitySchemes: [
        { type: "noauth" },
        { type: "oauth2", scopes: ["search.read"] }
      ],
      "openai/outputTemplate": "ui://widget/story.html",
      "openai/toolInvocation/invoking": "Searching…",
      "openai/toolInvocation/invoked": "Results ready"
    }
  },
  async ({ q }) => performSearch(q)
);
```

### Annotations

To label a tool as "read-only":

| Key | Type | Required | Notes |
|-----|------|----------|-------|
| `readOnlyHint` | boolean | No | Indicates tool does not mutate state |
