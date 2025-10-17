# Build a Custom UX

## Overview

UI components transform structured tool results into a human-friendly interface. Apps SDK components are typically React components that:
- Run inside an iframe
- Communicate via `window.openai` API
- Render inline with the conversation

## Understand the `window.openai` API

The `window.openai` API provides a bridge between the frontend and ChatGPT, offering methods to:
- Call tools
- Send follow-up messages
- Manage display modes
- Persist widget state

### Key API Methods

- `callTool`: Invoke a tool on the MCP server
- `sendFollowUpMessage`: Trigger a conversation follow-up
- `openExternal`: Open external links
- `requestDisplayMode`: Change app display mode
- `setWidgetState`: Persist component state

## Scaffold the Component Project

Recommended project structure:

```
app/
  server/            # MCP server
  web/               # Component bundle source
    package.json
    tsconfig.json
    src/component.tsx
    dist/component.js
```

## Author the React Component

Key steps for creating a component:
1. Mount into host shell
2. Subscribe to host globals
3. Render from tool output
4. Persist state and call host actions

## Bundle for the Iframe

Use a bundler like esbuild to create a single JavaScript module:

```json
{
  "scripts": {
    "build": "esbuild src/component.tsx --bundle --format=esm --outfile=dist/component.js"
  }
}
```

## Embed the Component

Integrate the component in your MCP server response, following the server setup documentation.

## Example Components

The SDK provides example components demonstrating different UI patterns:
- Pizzaz List
- Pizzaz Carousel
- Pizzaz Map
- Pizzaz Album
- Pizzaz Video

Each example shows how to:
- Bundle assets
- Wire host APIs
- Structure state for conversations

## Recommended Practices

- Keep dependencies lean
- Use React hooks for host interaction
- Maintain responsive layouts
- Persist minimal state
- Design tools to be idempotent
