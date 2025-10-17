# User Interaction

How users find, engage with, activate and manage apps that are available in ChatGPT.

## Discovery

Discovery refers to the different ways a user or the model can find out about your app and the tools it provides:
- Natural-language prompts
- Directory browsing
- Proactive entry points

Apps SDK uses tool metadata and past usage to make intelligent choices.

### Named Mention

When a user mentions the name of your app at the beginning of a prompt, your app will be automatically surfaced. The user must specify your app name at the start of their prompt.

### In-Conversation Discovery

When a user sends a prompt, the model evaluates:

- **Conversation context**
- **Conversation brand mentions and citations**
- **Tool metadata**
- **User linking state**

Ways to influence in-conversation discovery:

1. Write action-oriented tool descriptions
2. Write clear component descriptions
3. Regularly test golden prompt sets

### Directory

The directory provides a browsable surface to find apps, including:
- App name and icon
- Short and long descriptions
- Tags or categories
- Optional onboarding instructions or screenshots

## Entry Points

Once a user links your app, ChatGPT can surface it through several entry points:

### In-Conversation Entry

Linked tools are always in the model's context. Best practices:
- Keep tool descriptions action-oriented
- Return structured content with stable IDs
- Provide metadata hints for streamlined rendering

### Launcher

The launcher (accessible via + button in composer) is a high-intent entry point. Consider:
- Deep linking with starter prompts
- Context-aware app ranking
