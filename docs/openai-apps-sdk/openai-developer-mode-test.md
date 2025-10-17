ChatGPT Developer mode
======================

Full MCP client access for connectors and tools.

What is ChatGPT developer mode
------------------------------

ChatGPT developer mode is a beta feature that provides full Model Context Protocol (MCP) client support for all tools, both read and write. It's powerful but dangerous, and is intended for developers who understand how to safely configure and test connectors. When using developer mode, watch for [prompt injections and other risks](https://platform.openai.com/docs/mcp), model mistakes on write actions that could destroy data, and malicious MCPs that attempt to steal information.

How to use
----------

*   **Eligibility:** Available in beta to Pro, Plus, Business, Enterprise and Education accounts on the web.
    
*   **Enable developer mode:** Go to [**Settings → Connectors**](https://chatgpt.com/#settings/Connectors) → **Advanced → Developer mode**.
    
*   **Import MCPs:**
    
    *   Open [ChatGPT settings](https://chatgpt.com/#settings).
    *   In the **Connectors** tab, add your remote MCP server. It will appear in the composer's "Developer Mode" tool later during conversations.
    *   Supported connector protocols: SSE and streaming HTTP.
    *   Authentication supported: OAuth or no authentication.
*   **Manage tools:** In connector details, toggle tools on or off and refresh connectors to pull new tool lists and descriptions from the MCP server.
    
*   **Use connectors in conversations:** Choose **Developer mode** from the Plus menu and select connectors. You may need to explore different prompting techniques to call the correct tools. For example:
    
    *   Be explicit: "Use the "Acme CRM" connector's "update\_record" tool to …". When needed, include the server label and tool name.
    *   Disallow alternatives to avoid ambiguity: "Do not use built-in browsing or other tools; only use the Acme CRM connector."
    *   Disambiguate similar tools: "Prefer `Calendar.create_event` for meetings; do not use `Reminders.create_task` for scheduling."
    *   Specify input shape and sequencing: "First call `Repo.read_file` with `{ path: "…" }`. Then call `Repo.write_file` with the modified content. Do not call other tools."
    *   If multiple connectors overlap, state preferences up front (e.g., "Use `CompanyDB` for authoritative data; use other sources only if `CompanyDB` returns no results").
    *   Developer mode does not require `search`/`fetch` tools. Any tools your connector exposes (including write actions) are available, subject to confirmation settings.
    *   See more guidance in [Using tools](/docs/guides/tools) and [Prompting](/docs/guides/prompting).
    *   Improve tool selection with better tool descriptions: In your MCP server, write action-oriented tool names and descriptions that include "Use this when…" guidance, note disallowed/edge cases, and add parameter descriptions (and enums) to help the model choose the right tool among similar ones and avoid built-in tools when inappropriate.
    
    Examples:
    
    ```text
    Schedule a 30‑minute meeting tomorrow at 3pm PT with
    alice@example.com and bob@example.com using "Calendar.create_event".
    Do not use any other scheduling tools.
    ```
    
    ```text
    Create a pull request using "GitHub.open_pull_request" from branch
    "feat-retry" into "main" with title "Add retry logic" and body "…".
    Do not push directly to main.
    ```
    
*   **Reviewing and confirming tool calls:**
    
    *   Inspect JSON tool payloads verify correctness and debug problems. For each tool call, you can use the carat to expand and collapse the tool call details. Full JSON contents of the tool input and output are available.
    *   Write actions by default require confirmation. Carefully review the tool input which will be sent to a write action to ensure the behavior is as desired. Incorrect write actions can inadvertently destroy, alter, or share data!
    *   Read-only detection: We respect the `readOnlyHint` tool annotation (see [MCP tool annotations](https://modelcontextprotocol.io/legacy/concepts/tools#available-tool-annotations)). Tools without this hint are treated as write actions.
    *   You can choose to remember the approve or deny choice for a given tool for a conversation, which means it will apply that choice for the rest of that conversation. Because of this, you should only allow a tool to remember the approve choice if you know and trust the underlying application to make further write actions without your approval. New conversations will prompt for confirmation again. Refreshing the same conversation will also prompt for confirmation again on subsequent turns.



### 🧩 What Developer Mode Is

**ChatGPT Developer Mode** turns ChatGPT into a **full MCP client**, meaning it can connect to your **own MCP server** that exposes custom tools, APIs, or SDKs.  
It’s the official environment to **build, test, and debug** those integrations — effectively acting as a sandbox for **app developers** building extensions for ChatGPT.

---

### ⚙️ How It Fits with SDKs and App Testing

If you’re building an **MCP-based app or SDK**, the workflow looks like this:

1. **Build your MCP server**
    
    - Use any framework that can serve the MCP protocol (SSE or streaming HTTP).
        
    - Define your tools (actions/endpoints) in the MCP schema.
        
2. **Connect it to ChatGPT**
    
    - In ChatGPT → **Settings → Connectors → Advanced → Developer Mode**.
        
    - Add your MCP server URL and authentication (OAuth or none).
        
3. **Expose tools to ChatGPT**
    
    - Your MCP server advertises tools (e.g. `create_issue`, `read_file`, `update_contact`).
        
    - You can then call these tools from inside a chat prompt using developer-mode commands.
        
4. **Test & Debug**
    
    - You can explicitly instruct ChatGPT which connector and tool to use.
        
    - ChatGPT will show the **full JSON payloads** for inspection before write operations.
        
    - You can see both **inputs and outputs**, so it’s great for SDK debugging.
        

---

### 🧪 Example of Testing a Tool

`Use the "GitHub.open_pull_request" tool from my connector to create a PR from branch "feature-logging" into "main" with the title "Add logging system". Do not use any built-in tools.`

If your MCP exposes that GitHub connector, ChatGPT will:

- Build the JSON payload.
    
- Ask you to confirm before sending it (for safety).
    
- Display the tool call results inline.
    

That’s how you can iteratively **test your SDK actions** in a conversational way.

---

### ⚠️ Important Notes

- Developer mode **is not production** — it’s meant for **safe testing and validation**.
    
- Always **review tool payloads** before confirming write actions (they can modify or delete data).
    
- You can “remember approval” for trusted tools during one conversation only.
    
- It’s still in **beta**, so expect some instability or missing features.
    

---

### 🔗 Resources

- **MCP Overview:** [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
    
- **ChatGPT Connectors Docs:** [https://platform.openai.com/docs/mcp](https://platform.openai.com/docs/mcp?utm_source=chatgpt.com)
    
- **Example MCP SDKs:** [https://github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)
    

---

If you’d like, I can show you a **minimal working example** of a simple MCP server (e.g. in Python or Node.js) and how to connect it to ChatGPT Developer Mode for testing.  
Would you like that?

##### You said:

yes

###### ChatGPT said:

Thought for 27s

Awesome — here’s a tiny, runnable MCP “hello world” you can use to test in **ChatGPT → Developer mode**. I’ll show a minimal Node.js server that exposes one tool, plus how to connect it in ChatGPT. I’m also linking the official docs and the canonical quickstart repo so you can compare behavior and scaffold from a full example. [GitHub+3OpenAI Platform+3OpenAI Platform+3](https://platform.openai.com/docs/guides/developer-mode)

---

# Minimal MCP server (Node.js)

This uses plain JSON-RPC over HTTP (“streaming HTTP” compatible) and implements the two core MCP tool methods: `tools/list` and `tools/call`. The single tool is `add` (adds two numbers).

1. **Create project**
    

`mkdir mcp-min && cd mcp-min npm init -y npm i express body-parser`

2. **server.js**
    

``const express = require("express"); const bodyParser = require("body-parser");  const app = express(); app.use(bodyParser.json());  // Simple in-memory tool registry (1 tool: add) const tools = [   {     name: "add",     title: "Add two numbers",     description: "Returns the sum of a and b",     inputSchema: {       type: "object",       properties: {         a: { type: "number", description: "First number" },         b: { type: "number", description: "Second number" }       },       required: ["a", "b"]     }   } ];  // MCP capabilities response (server advertises it supports tools) const capabilities = { capabilities: { tools: { listChanged: false } } };  // Optional: expose capabilities at root for quick sanity checks app.get("/", (_req, res) => res.json(capabilities));  // Single JSON-RPC endpoint for brevity app.post("/rpc", async (req, res) => {   const { id, method, params } = req.body || {};   try {     if (method === "tools/list") {       // Paginate as needed; here we return all tools       return res.json({         jsonrpc: "2.0",         id,         result: { tools, nextCursor: null }       });     }      if (method === "tools/call") {       const { name, arguments: args } = params || {};       if (name === "add") {         const a = Number(args?.a);         const b = Number(args?.b);         if (Number.isNaN(a) || Number.isNaN(b)) {           throw new Error("Invalid arguments: a and b must be numbers");         }         return res.json({           jsonrpc: "2.0",           id,           result: {             content: [{ type: "text", text: String(a + b) }],             isError: false           }         });       }       throw new Error(`Unknown tool: ${name}`);     }      // Fallback for unsupported methods     return res.status(400).json({       jsonrpc: "2.0",       id,       error: { code: -32601, message: `Method not found: ${method}` }     });   } catch (err) {     return res.status(200).json({       jsonrpc: "2.0",       id,       result: {         content: [{ type: "text", text: String(err.message || err) }],         isError: true       }     });   } });  const PORT = process.env.PORT || 3030; app.listen(PORT, () => {   console.log(`MCP server listening on http://localhost:${PORT}`); });``

3. **Run it**
    

`node server.js # -> MCP server listening on http://localhost:3030`

---

# Connect it in ChatGPT (Developer mode)

1. In ChatGPT (web): **Settings → Connectors → Advanced → Developer mode** (enable). [OpenAI Platform](https://platform.openai.com/docs/guides/developer-mode)
    
2. In **Connectors**, add a **remote MCP server** with:
    
    - **Protocol:** Streaming HTTP
        
    - **URL:** `http://localhost:3030/rpc`
        
    - (Auth: None for this demo)  
        It will then appear in the composer under **Developer mode**. [OpenAI Platform](https://platform.openai.com/docs/guides/developer-mode)
        
3. Start a chat, switch to **Developer mode**, select your connector, and try:
    
    `Use my MCP connector’s "add" tool with { "a": 2, "b": 3 }. Do not use other tools.`
    
4. You’ll see JSON tool calls and outputs. For write actions, Developer mode asks for confirmation before calling — review payloads carefully. [OpenAI Platform](https://platform.openai.com/docs/guides/developer-mode)
    

---

# Why this works (and what to improve)

- MCP servers that expose tools must implement **tool discovery** and **tool invocation**. In MCP, clients call `tools/list` and `tools/call` with JSON-RPC messages; responses carry typed content (e.g., `type: "text"`). The code above mirrors the message shapes from the spec. [Model Context Protocol](https://modelcontextprotocol.io/docs/concepts/tools)
    
- For a production server, use an official quickstart template (TypeScript/Python/Rust) and add transport niceties (pagination, errors, streaming, progress, auth). Canonical examples: **“weather-server-typescript”** in the official quickstart repo. [GitHub](https://github.com/modelcontextprotocol/quickstart-resources)
    

---

# Official references (skim these when expanding beyond the demo)

- **ChatGPT Developer mode** (enable & connect custom MCP servers). [OpenAI Platform](https://platform.openai.com/docs/guides/developer-mode)
    
- **OpenAI: MCP docs hub** (how ChatGPT uses MCP connectors/tools). [OpenAI Platform](https://platform.openai.com/docs/mcp)
    
- **MCP spec: Tools** (message shapes for `tools/list` and `tools/call`). [Model Context Protocol](https://modelcontextprotocol.io/docs/concepts/tools)
    
- **Quickstart servers & clients (weather server)** — ready-to-run templates. [GitHub](https://github.com/modelcontextprotocol/quickstart-resources)
    

If you want, I can also drop a **Python/FastAPI** version of the same minimal server, or help you adapt this to your real SDK (e.g., “create_ticket”, “read_file”, etc.).