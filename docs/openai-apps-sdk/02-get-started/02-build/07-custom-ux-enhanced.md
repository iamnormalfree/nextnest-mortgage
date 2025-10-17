# Build a Custom UX for Apps SDK

## Overview

The documentation provides a comprehensive guide to creating custom UI components for ChatGPT apps using React and the `window.openai` API.

## Key Concepts

### `window.openai` API Features

- Bridge between frontend and ChatGPT
- Provides methods for:
  - Calling tools
  - Sending follow-up messages
  - Managing app state
  - Requesting display mode changes

### Component Development Principles

1. Use React components running inside an iframe
2. Communicate with host via `window.openai` API
3. Render inline with conversation

## Project Structure

```
app/
  server/            # MCP server
  web/               # Component bundle source
    package.json
    tsconfig.json
    src/component.tsx
    dist/component.js
```

## Development Steps

1. Install dependencies
2. Create React component
3. Use hooks like `useOpenAiGlobal`
4. Bundle component with esbuild
5. Embed in server response

## Example Hooks

```typescript
// Read global state
function useOpenAiGlobal<K extends keyof OpenAiGlobals>(key: K)

// Persist widget state
function useWidgetState<T extends WidgetState>(defaultState: T)
```

## Best Practices

- Keep dependencies lean
- Make tools idempotent
- Persist minimal state
- Use standard routing APIs
- Respond to host layout changes

## Recommended Resources

- [Examples repository](https://github.com/openai/openai-apps-sdk-examples)
- Example components in the documentation

The guide provides a detailed walkthrough for developers looking to create interactive, context-aware components for ChatGPT applications.

## Related Links

- [Previous: Set up your server](/apps-sdk/build/server)
- [Next: Authenticate users](/apps-sdk/build/auth)
