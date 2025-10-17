# Set up your Server

## Overview

The MCP (Model Context Protocol) server is the foundation of every Apps SDK integration. It:
- Exposes tools the model can call
- Enforces authentication
- Packages structured data and component HTML for ChatGPT

## Choose an SDK

Two official SDKs are available:
- **Python SDK**: Great for rapid prototyping
  - Repo: [`modelcontextprotocol/python-sdk`](https://github.com/modelcontextprotocol/python-sdk)
- **TypeScript SDK**: Ideal for Node/React stacks
  - Package: `@modelcontextprotocol/sdk`

## Describe Your Tools

Tools define a contract between ChatGPT and your backend:
- Machine name
- Human-friendly title
- JSON schema for tool invocation

### Point to a Component Template

Steps to register a template:
1. Expose a resource with `mimeType: text/html+skybridge`
2. Link tool to template via `_meta["openai/outputTemplate"]`
3. Version carefully to prevent caching issues

## Code Example: MCP Server Setup

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "kanban-server",
  version: "1.0.0"
});

// Register UI resource and tool
server.registerResource(
  "kanban-widget",
  "ui://widget/kanban-board.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/kanban-board.html",
      mimeType: "text/html+skybridge",
      text: `<div id="kanban-root"></div>`
    }]
  })
);

server.registerTool(
  "kanban-board",
  {
    title: "Show Kanban Board",
    inputSchema: { tasks: z.string() }
  },
  async () => ({
    structuredContent: {},
    content: [{ type: "text", text: "Displayed the kanban board" }],
    _meta: {
      "openai/outputTemplate": "ui://widget/kanban-board.html"
    }
  })
);
```

## Next Steps

- [Build a Custom UX](/apps-sdk/build/custom-ux)
- [Authenticate Users](/apps-sdk/build/auth)
- [Persist State](/apps-sdk/build/storage)
