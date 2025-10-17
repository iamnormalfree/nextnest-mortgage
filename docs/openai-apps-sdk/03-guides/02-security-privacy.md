# Security & Privacy

## Principles

Apps SDK provides access to user data, third-party APIs, and write actions. Key principles include:

- **Least privilege**: Request only necessary scopes, storage access, and network permissions
- **Explicit user consent**: Ensure users understand account linking and write access
- **Defense in depth**: Assume potential prompt injection and validate all inputs

## Data Handling

- **Structured content**: Include only required data for current prompt
- **Storage**:
  - Decide data retention period
  - Publish retention policy
  - Respect deletion requests
- **Logging**:
  - Redact personally identifiable information (PII)
  - Store correlation IDs
  - Avoid storing raw prompt text unless necessary

## Prompt Injection and Write Actions

Mitigate risks by:
- Regularly reviewing tool descriptions
- Validating all server-side inputs
- Requiring human confirmation for irreversible operations

## Network Access

- Widgets run in sandboxed iframe with strict Content Security Policy
- Cannot access privileged browser APIs
- Standard `fetch` requests allowed with CSP compliance

## Authentication & Authorization

- Use OAuth 2.1 flows with PKCE
- Verify and enforce scopes on tool calls
- Reject expired or malformed tokens

## Operational Readiness

- Conduct security reviews before launch
- Monitor for anomalous traffic patterns
- Set up alerts for repeated errors
- Keep dependencies patched

**Key Takeaway**: "Security and privacy are foundational to user trust. Bake them into your planning, implementation, and deployment workflows."
