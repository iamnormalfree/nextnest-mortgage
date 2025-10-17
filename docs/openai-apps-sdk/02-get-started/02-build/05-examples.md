# Examples

## Overview

The Pizzaz demo app showcases UI components for a comprehensive end-to-end Apps SDK experience. The examples are available in the [examples repository on GitHub](https://github.com/openai/openai-apps-sdk-examples).

## Components

The demo includes several key components:

### 1. MCP Source

A TypeScript server demonstrating how to register multiple tools that share data with pre-built UI resources. Each resource call returns a Skybridge HTML shell with matching metadata for ChatGPT rendering.

### 2. Pizzaz Map

A React + Mapbox component that:
- Renders marker interactions
- Provides inspector routing
- Handles fullscreen interactions
- Syncs state with ChatGPT

### 3. Pizzaz Carousel

A lightweight gallery view using embla-carousel that:
- Supports touch-friendly scrolling
- Manages button states reactively
- Displays place cards with details

### 4. Pizzaz List

A list layout designed for chat-initiated itineraries, featuring:
- A hero summary
- Scrollable ranking
- Dense information hierarchy

### 5. Pizzaz Video

A media-rich component that:
- Tracks playback
- Overlays controls
- Reacts to fullscreen changes
- Integrates with ChatGPT container APIs

## Code Examples

Each component includes detailed source code demonstrating different UI interaction patterns, state management, and integration techniques with the OpenAI Apps SDK.

The examples serve as blueprints for developers building their own interactive applications within the ChatGPT ecosystem.
