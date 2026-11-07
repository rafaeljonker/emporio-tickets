import { vi } from 'vitest';

/** A controllable IntersectionObserver for jsdom: call `trigger()` to simulate visibility. */
export function installIntersectionObserver() {
  const instances: { callback: IntersectionObserverCallback; elements: Element[] }[] = [];
  class FakeObserver {
    readonly root = null;
    readonly rootMargin: string;
    readonly thresholds = [0];
    private readonly entry: { callback: IntersectionObserverCallback; elements: Element[] };
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.rootMargin = options?.rootMargin ?? '';
      this.entry = { callback, elements: [] };
      instances.push(this.entry);
    }
    observe(element: Element) {
      this.entry.elements.push(element);
    }
    unobserve() {
      // Not needed by the code under test.
    }
    disconnect() {
      this.entry.elements = [];
    }
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return {
    trigger() {
      for (const { callback, elements } of instances) {
        for (const target of elements) {
          callback([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
        }
      }
    },
  };
}
