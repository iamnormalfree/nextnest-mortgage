# Storage

## Why storage matters

Apps SDK handles conversation state automatically, but most real-world apps also need durable storage. You might cache data, track user preferences, or persist artifacts created inside a component.

## Bring your own backend

If you already run an API or need multi-user collaboration, integrate with your existing storage layer:

- Authenticate the user via OAuth
- Use your backend's APIs to fetch and mutate data
- Return structured content so the model can understand data

Consider:
- Data residency and compliance
- Rate limits
- Versioning

## Persisting component state

Design a clear state contract:

- Use `window.openai.setWidgetState` for ephemeral UI state
- Persist durable artifacts in your backend
- Handle merge conflicts gracefully

## Operational tips

- Implement backups and monitoring
- Set clear data retention policies
- Test thoroughly with internal users before broad launch

"Treat MCP traffic like any other API. Log tool calls with correlation IDs and monitor for error spikes."

## Related Links

- [Previous: Authenticate users](/apps-sdk/build/auth)
- [Next: Examples](/apps-sdk/build/examples)
