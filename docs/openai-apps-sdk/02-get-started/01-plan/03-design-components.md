# Design Components

## Why Components Matter

UI components are the human-visible part of your connector. They allow users to:
- View or edit data inline
- Switch to fullscreen when needed
- Keep context synchronized between typed prompts and UI actions

## Clarify the User Interaction

For each use case, consider:
- **Viewer vs. editor**: Is the component read-only or supports editing?
- **Single-shot vs. multiturn**: Will the task complete in one invocation or persist across turns?
- **Inline vs. fullscreen**: Determine appropriate display modes

## Map Data Requirements

Components should:
- Receive complete data in the tool response
- Use `window.openai.toolOutput` for initial render
- Handle authentication context
- Use `window.openai.setWidgetState` for caching state

## Design for Responsive Layouts

Plan for:
- Adaptive breakpoints
- Accessible color and motion
- Responsive screen transitions
- Consistent CSS variables and iconography

## Define the State Contract

Consider:
- Component state management
- Server-side state storage
- Model message synchronization

## Plan Telemetry and Debugging Hooks

Prepare for:
- Analytics event tracking
- Error logging
- Component load fallbacks

## Key Recommendations

1. Sketch component interactions early
2. Define structured JSON payloads
3. Create responsive design
4. Plan state management
5. Implement debugging mechanisms

**Next Step**: [Build a custom UX](/apps-sdk/build/custom-ux)
