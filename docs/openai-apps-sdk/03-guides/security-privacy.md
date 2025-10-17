# Security & Privacy

## Principles

Apps SDK provides access to user data, third-party APIs, and write actions. Key principles include:

- **Least privilege** – Request only necessary scopes, storage access, and network permissions
- **Explicit user consent** – Ensure users understand account linking and write access
- **Defense in depth** – Assume potential prompt injection and validate all inputs

## Data Handling

- **Structured content** – Include only required data for current prompt
- **Storage** – Define data retention policy and respect deletion requests
- **Logging** – Redact personally identifiable information (PII)

## Prompt Injection and Write Actions

Mitigate risks by:
- Reviewing tool descriptions to discourage misuse
- Validating all inputs server-side
- Requiring human confirmation for irreversible operations

## Network Access

- Widgets run in a sandboxed iframe with strict Content Security Policy
- Cannot access privileged browser APIs
- Standard `fetch` requests allowed with CSP compliance

## Authentication & Authorization

- Use OAuth 2.1 flows with PKCE
- Verify and enforce scopes on every tool call
- Reject expired or malformed tokens

## Operational Readiness

- Conduct security reviews before launch
- Monitor for anomalous traffic patterns
- Keep dependencies patched

**Key Takeaway**: Security and privacy are foundational to user trust. Integrate these considerations throughout development.
