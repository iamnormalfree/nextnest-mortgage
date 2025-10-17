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
- Surface sensitive information
- Duplicate ChatGPT's system functions

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
- 3-8 items recommended
- Include image, title, and minimal metadata

### Fullscreen

Immersive experiences for complex interactions.

- Maintain conversational context
- Support multi-step workflows
- Keep system composer always accessible

### Picture-in-Picture (PiP)

Persistent floating window for ongoing sessions.
- Used for parallel activities
- Can update dynamically
- Automatically closes when session ends

## Visual Design Guidelines

### Color
- Use system-defined palettes
- Add brand accents sparingly
- Avoid custom gradients

### Typography
- Use platform-native system fonts
- Inherit system sizing rules
- Limit font size variation

### Spacing & Layout
- Use consistent system grid spacing
- Maintain clear visual hierarchy
- Respect system corner radii

### Accessibility
- Maintain minimum contrast ratios
- Provide alt text
