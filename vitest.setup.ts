// ABOUTME: Vitest setup for BullMQ integration tests
// ABOUTME: Node environment setup, no DOM polyfills needed

// Polyfill for TransformStream (required by AI SDK if used in integration tests)
if (typeof global.TransformStream === 'undefined') {
  const { TransformStream } = require('stream/web');
  global.TransformStream = TransformStream;
}
