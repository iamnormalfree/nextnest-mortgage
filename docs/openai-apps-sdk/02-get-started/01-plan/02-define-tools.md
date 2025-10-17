# Define Tools

## Tool-first Thinking

In Apps SDK, tools are the contract between your MCP server and the model. They describe:
- What the connector can do
- How to call it
- What data comes back

Good tool design ensures:
- Accurate discovery
- Reliable invocation
- Predictable downstream UX

## Draft the Tool Surface Area

Start from your user journey:

### Key Principles
- **One job per tool**: Focus on single read or write actions
- **Explicit inputs**: Define `inputSchema` with:
  - Parameter names
  - Data types
  - Enums
- **Predictable outputs**: Enumerate structured fields

## Capture Metadata for Discovery

For each tool, draft:
- **Name**: Action-oriented and unique
- **Description**: Explain when to use the tool
- **Parameter annotations**: Describe arguments and constraints
- **Global metadata**: App-level details

## Model-side Guardrails

Consider:
- Prelinked vs. link-required tools
- Read-only hints
- Result components

## Golden Prompt Rehearsal

Validate your tool set:
1. Confirm tools address direct prompts
2. Ensure tool descriptions provide context
3. Verify metadata prevents unintended use

## Handoff to Implementation

Compile:
- Tool specifications
- Input/output schemas
- UI component details
- Auth requirements
- Test prompts

**Next steps**: Translate plan into code using MCP SDK
