# Research Use Cases

## Why Start with Use Cases

Every successful Apps SDK app begins with a clear understanding of user goals. Discovery in ChatGPT is model-driven: the assistant selects your app when your metadata, descriptions, and usage align with the user's prompt and memories.

## Gather Inputs

Begin with research:

- **User interviews and support requests** – capture:
  - Jobs-to-be-done
  - User terminology
  - Existing data sources

- **Prompt sampling** – list:
  - Direct asks (e.g., "show my Jira board")
  - Indirect intents (e.g., "what am I blocked on for the launch?")

- **System constraints** – note:
  - Compliance requirements
  - Offline data
  - Rate limits

Document each scenario with:
- User persona
- Context
- Success definition

## Define Evaluation Prompts

For each use case:

1. **Direct prompts**
   - At least five explicit prompts referencing your data or product

2. **Indirect prompts**
   - Five prompts stating a goal without naming a specific tool

3. **Negative prompts**
   - Prompts that should not trigger your app

## Scope the Minimum Lovable Feature

Decide on:
- Inline information requirements
- Write access actions
- Persistent state needs

Rank use cases by:
- User impact
- Implementation effort

## Translate Use Cases into Tooling

Draft the tool contract:

- **Inputs**
  - Explicit parameters
  - Constrained enums
  - Default values

- **Outputs**
  - Structured content
  - Reasoning-friendly fields

- **Component intent**
  - Read-only viewer
  - Editor
  - Multiturn workspace

## Prepare for Iteration

Plan for:
- Weekly prompt accuracy review
- Early tester feedback collection
- Adoption analytics tracking

These research artifacts will guide your:
- Roadmap
- Changelog
- Success metrics

[Next: Define Tools](/apps-sdk/plan/tools)
