# MCP

## What is MCP?

The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools and resources. An MCP server exposes **tools** that a model can call during a conversation, returning results with specified parameters.

## Protocol Building Blocks

A minimal MCP server for Apps SDK implements three key capabilities:

1. **List tools** – Server advertises supported tools with:
   - JSON Schema input and output contracts
   - Optional annotations

2. **Call tools** – Model sends a `call_tool` request with arguments corresponding to user intent
   - Server executes the action
   - Returns structured content for model parsing

3. **Return components** – Tools can include:
   - Structured content
   - Optional embedded resources for interface rendering

## Why Apps SDK Standardises on MCP

Benefits include:

- **Discovery integration** – Model consumes tool metadata like first-party connectors
- **Conversation awareness** – Structured content flows through conversation
- **Multiclient support** – Works across different ChatGPT platforms
- **Extensible auth** – Supports protected resource metadata and OAuth flows

## Next Steps

Recommended resources:
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification)
- Python and TypeScript SDKs
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) for debugging

The protocol is transport-agnostic and can be hosted via Server-Sent Events or Streamable HTTP, with Streamable HTTP recommended.
