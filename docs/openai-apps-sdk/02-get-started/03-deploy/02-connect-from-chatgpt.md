# Connect from ChatGPT

## Before you begin

Connecting your MCP server to ChatGPT requires developer mode access:

1. Ask your OpenAI partner contact to add you to the connectors developer experiment.
2. If you are on ChatGPT Enterprise, have your workspace admin enable connector creation.
3. Toggle **Settings → Connectors → Advanced → Developer mode** in the ChatGPT client.

Once developer mode is active, you will see a **Create** button under Settings → Connectors.

## Create a connector

1. Ensure your MCP server is reachable over HTTPS (use ngrok for local development).
2. In ChatGPT, navigate to **Settings → Connectors → Create**.
3. Provide the metadata for your connector:
   - **Connector name** – a user-facing title such as _Kanban board_
   - **Description** – explain what the connector does and when to use it
   - **Connector URL** – the public `/mcp` endpoint of your server
4. Click **Create**. If the connection succeeds, you'll see a list of tools your server advertises.

## Enable the connector in a conversation

1. Open a new chat in ChatGPT.
2. Click the **+** button near the message composer and choose **Developer mode**.
3. Toggle on your connector in the list of available tools.
4. Prompt the model explicitly while validating the integration.

ChatGPT will display tool-call payloads in the UI for confirmation.

## Refreshing metadata

1. Update your MCP server and redeploy it.
2. In **Settings → Connectors**, click into your connector and choose **Refresh**.
3. Verify the tool list updates and test prompts.

## Connecting other clients

- **API Playground** – Use `https://platform.openai.com/playground` to add an MCP Server
- **Mobile clients** – Connectors linked on web are available on mobile apps
