# Optimize Metadata

## Why metadata matters

ChatGPT uses metadata to decide when to call your connector. Well-crafted metadata helps with:
- Increasing recall on relevant prompts
- Reducing accidental activations
- Treating metadata like product copy that needs iteration and testing

## Gather a golden prompt set

Before tuning metadata, create a dataset including:
- **Direct prompts**: Users explicitly name your product
- **Indirect prompts**: Users describe desired outcome
- **Negative prompts**: Cases for alternative tools

Document expected behavior for each prompt for regression testing.

## Draft metadata that guides the model

For each tool, focus on:
- **Name**: Combine domain and action (e.g., `calendar.create_event`)
- **Description**: Start with "Use this when..." and note disallowed cases
- **Parameter docs**:
  - Describe arguments
  - Include examples
  - Use enums for constrained values
- **Read-only hint**: Annotate `readOnlyHint: true` for tools that don't mutate state

At the app level, provide:
- Polished description
- Icon
- Starter prompts
- Sample conversations highlighting key use cases

## Evaluate in developer mode

1. Link connector in ChatGPT developer mode
2. Run through golden prompt set
3. Track:
   - Which tool was selected
   - Arguments passed
   - Component rendering
4. Assess precision and recall

## Iterate methodically

- Change one metadata field at a time
- Log revisions with timestamps
- Share diffs with reviewers
- Repeat evaluation
- Aim for high precision on negative prompts

## Production monitoring

- Review tool-call analytics weekly
- Capture user feedback
- Update descriptions for common misconceptions
- Schedule periodic prompt replays

**Key Takeaway**: Treat metadata as a living asset. Intentional wording and evaluation improve tool discovery and invocation.
