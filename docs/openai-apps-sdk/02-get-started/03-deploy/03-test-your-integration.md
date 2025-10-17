# Test your integration

## Goals

Testing validates that your connector behaves predictably before exposing it to users. Focus on three areas:
- Tool correctness
- Component UX
- Discovery precision

## Unit test your tool handlers

- Exercise each tool function directly with representative inputs
- Verify schema validation and error handling
- Include automated tests for authentication flows
- Keep test fixtures close to MCP code

## Use MCP Inspector during development

1. Run your MCP server
2. Launch the inspector: `npx @modelcontextprotocol/inspector@latest`
3. Enter your server URL
4. Use **List Tools** and **Call Tool** to inspect requests and responses

## Validate in ChatGPT developer mode

- Link connector in **Settings → Connectors → Developer mode**
- Toggle on in a new conversation
- Run through golden prompt set
- Test mobile layouts

## Connect via the API Playground

1. Choose **Tools → Add → MCP Server**
2. Provide HTTPS endpoint
3. Issue test prompts
4. Inspect JSON request/response pairs

## Regression checklist before launch

- Verify tool list matches documentation
- Confirm structured content matches `outputSchema`
- Check widget rendering and state restoration
- Test authentication flows
- Validate discovery behavior

Capture findings in a document to track consistency across releases.
