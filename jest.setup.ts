// ABOUTME: Sets up shared Jest utilities for NextNest tests.
// ABOUTME: Extends expect with DOM-focused assertions.
import '@testing-library/jest-dom';

const elementProto = Element.prototype as any;

if (!elementProto.setPointerCapture) {
  elementProto.setPointerCapture = () => {};
}

if (!elementProto.releasePointerCapture) {
  elementProto.releasePointerCapture = () => {};
}

if (!elementProto.hasPointerCapture) {
  elementProto.hasPointerCapture = () => false;
}

if (!elementProto.scrollIntoView) {
  elementProto.scrollIntoView = () => {};
}

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (window as any).ResizeObserver = ResizeObserverStub;
  ;(global as any).ResizeObserver = ResizeObserverStub;
}
