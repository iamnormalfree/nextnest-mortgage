# Optimize Metadata

## Why metadata matters

ChatGPT decides when to call your connector based on the metadata you provide. Well-crafted names, descriptions, and parameter docs increase recall on relevant prompts and reduce accidental activations.

## Gather a golden prompt set

Before tuning metadata, assemble a labelled dataset:

- **Direct prompts** – users explicitly name your product or data source
- **Indirect prompts** – users describe the outcome they want without naming your tool
- **Negative prompts** – cases where built-in tools or other connectors should handle the request

Document the expected behaviour for each prompt for regression testing.

## Draft metadata that guides the model

For each tool:

- **Name** – pair the domain with the action (e.g., `calendar.create_event`)
- **Description** – start with "Use this when…" and call out disallowed cases
- **Parameter docs** – describe each argument, include examples, use enums for constrained values
- **Read-only hint** – annotate `readOnlyHint: true` on tools that never mutate state

At the app level, supply a polished description, icon, and starter prompts highlighting best use cases.

## Evaluate in developer mode

1. Link your connector in ChatGPT developer mode
2. Run through the golden prompt set
3. Track precision and recall for each prompt

If the model picks the wrong tool, revise descriptions to emphasize the intended scenario.

## Iterate methodically

- Change one metadata field at a time
- Keep a log of revisions with timestamps and test results
- Share diffs with reviewers

Repeat evaluation after each revision.

## Production monitoring

Once your connector is live:

- Review tool-call analytics weekly
- Capture user feedback
- Update descriptions to cover common misconceptions
- Schedule periodic prompt replays

Treat metadata as a living asset. Intentional wording and evaluation improve discovery and invocation.
