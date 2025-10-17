# App Design Guidelines

## Overview

Apps are developer-built experiences inside ChatGPT that extend functionality while maintaining the platform's conversational flow. They appear through lightweight cards, carousels, and fullscreen views that integrate seamlessly into ChatGPT's interface.

## Best Practices

### Principles

- **Conversational**: Seamlessly extend ChatGPT's conversational UI
- **Intelligent**: Anticipate user intent and context
- **Simple**: Focus on clear, minimal actions
- **Responsive**: Enhance conversation without overwhelming
- **Accessible**: Support users with diverse needs

### Good Use Cases

A good app should:
- Fit naturally into conversation
- Be time-bound or action-oriented
- Provide immediately valuable information
- Be visually summarizable
- Extend ChatGPT's capabilities uniquely

### Poor Use Cases

Avoid apps that:
- Display long-form static content
- Require complex multi-step workflows
- Use space for ads or irrelevant messaging
- Surface sensitive information publicly
- Duplicate existing ChatGPT functions

## Display Modes

### Inline

Appears directly in conversation flow, typically before the model response.

#### Inline Card
- Lightweight, single-purpose widgets
- Support quick actions or data display
- Limit to two primary actions
- No deep navigation or nested scrolling

#### Inline Carousel
- Present multiple similar items
- 3-8 items maximum
- Include images and minimal metadata

### Fullscreen

Immersive experiences for complex interactions.

- Supports multi-step workflows
- Maintains conversational context
- Allows deeper engagement

### Picture-in-Picture (PiP)

Persistent floating window for ongoing sessions.
- Used for parallel activities
- Can update dynamically
- Automatically closes when session ends

## Visual Design Guidelines

### Color
- Use system-defined palettes
- Preserve ChatGPT's minimal aesthetic
- Use brand colors sparingly

### Typography
- Inherit system fonts
- Maintain consistent sizing
- Avoid custom font variations

### Spacing & Layout
- Follow system grid spacing
- Maintain consistent padding
- Preserve visual hierarchy

### Accessibility
- Maintain contrast ratios
- Provide alt text
- Support text resizing
