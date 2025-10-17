# OpenAI Apps SDK Documentation

Complete documentation for the OpenAI Apps SDK, downloaded on October 10, 2025.

## Overview

The Apps SDK allows developers to build web-based applications that run as interactive components inside ChatGPT conversations. Apps are available in preview for developers to begin building and testing, with app submission opening later this year.

## Documentation Structure

### 00. Introduction
- [Index](./00-index.md) - Main overview and getting started

### 01. Core Concepts
- [MCP Server](./01-core-concepts/01-mcp-server.md) - Understanding the Model Context Protocol
- [User Interaction](./01-core-concepts/02-user-interaction.md) - How users discover and interact with apps
- [Design Guidelines](./01-core-concepts/03-design-guidelines.md) - Principles for app design

### 02. Get Started

#### Plan
- [Index](./02-get-started/00-index.md) - Getting started overview
- [Research Use Cases](./02-get-started/01-plan/01-research-use-cases.md) - Identifying app opportunities
- [Define Tools](./02-get-started/01-plan/02-define-tools.md) - Defining your app's capabilities
- [Design Components](./02-get-started/01-plan/03-design-components.md) - Planning your UI components

#### Build
- [Set Up Your Server](./02-get-started/02-build/01-set-up-your-server.md) - MCP server setup
- [Build Custom UX](./02-get-started/02-build/02-build-custom-ux.md) - Creating interactive interfaces
- [Authenticate Users](./02-get-started/02-build/03-authenticate-users.md) - User authentication patterns
- [Persist State](./02-get-started/02-build/04-persist-state.md) - State management
- [Examples](./02-get-started/02-build/05-examples.md) - Sample implementations

#### Deploy
- [Deploy Your App](./02-get-started/03-deploy/01-deploy-your-app.md) - Deployment guide
- [Connect from ChatGPT](./02-get-started/03-deploy/02-connect-from-chatgpt.md) - Integration setup
- [Test Your Integration](./02-get-started/03-deploy/03-test-your-integration.md) - Testing procedures

### 03. Guides
- [Optimize Metadata](./03-guides/01-optimize-metadata.md) - Best practices for metadata
- [Security & Privacy](./03-guides/02-security-privacy.md) - Security considerations
- [Troubleshooting](./03-guides/03-troubleshooting.md) - Common issues and solutions

### 04. Resources
- [Reference](./04-resources/01-reference.md) - API reference and technical specs
- [App Developer Guidelines](./04-resources/02-app-developer-guidelines.md) - Quality and policy requirements

### 05. Design Quality
- [Design Quality](./05-design-quality.md) - Comprehensive design principles

## Key Concepts

### Model Context Protocol (MCP)
The Apps SDK is built on MCP, an open standard that enables:
- **Discovery integration** - ChatGPT can discover and call your tools
- **Conversation awareness** - Access to conversation context
- **Multiclient support** - Works across different ChatGPT interfaces
- **Extensible auth** - Flexible authentication options

### App Types
Apps can be built for various use cases:
- Information retrieval and search
- Data visualization and analysis
- Interactive workflows and forms
- Integration with external services
- Real-time data updates

### Display Modes
Apps support multiple display modes:
- **Inline Card** - Compact information display
- **Inline Carousel** - Multiple items in sequence
- **Fullscreen** - Immersive experiences
- **Picture-in-Picture** - Persistent overlays

## Getting Started

1. **Research** - Identify a valuable use case for your app
2. **Plan** - Define tools and design components
3. **Build** - Set up your MCP server and create custom UX
4. **Deploy** - Deploy your app and test the integration
5. **Submit** - (Coming later in 2025) Submit for review and publication

## Development Resources

- Official documentation: https://developers.openai.com/apps-sdk/
- Model Context Protocol: https://modelcontextprotocol.io/
- ChatGPT Developer Mode: Available in ChatGPT settings

## Documentation Notes

- Downloaded: October 10, 2025
- Source: https://developers.openai.com/apps-sdk/
- Format: Markdown
- Status: Apps SDK is in preview

## Missing/Unavailable Pages

The following page returned 404 and may be added in future documentation updates:
- Troubleshooting guide (placeholder created)

---

**Note**: This documentation is for the preview version of the Apps SDK. Features and guidelines may change as the platform evolves toward general availability.
