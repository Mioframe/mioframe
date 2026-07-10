import { afterEach, describe, expect, it } from 'vitest';
import { getReorderVisibleBounds } from './reorderBounds';

const stubRect = (element: HTMLElement, top: number, bottom: number) => {
  element.getBoundingClientRect = (): DOMRect => ({
    top,
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('getReorderVisibleBounds', () => {
  it('returns the container rect clamped to the viewport when there is no clipping ancestor', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);
    stubRect(container, 50, 250);

    const bounds = getReorderVisibleBounds(container);

    expect(bounds.top).toBe(50);
    expect(bounds.bottom).toBe(250);
  });

  it('shrinks to a clipping ancestor smaller than the container', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');

    ancestor.style.overflowY = 'auto';
    ancestor.appendChild(container);
    document.body.appendChild(ancestor);

    stubRect(ancestor, 100, 300);
    stubRect(container, 0, 1000);

    const bounds = getReorderVisibleBounds(container);

    expect(bounds.top).toBe(100);
    expect(bounds.bottom).toBe(300);
  });

  it('ignores a non-clipping ancestor with visible overflow', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');

    ancestor.style.overflow = 'visible';
    ancestor.appendChild(container);
    document.body.appendChild(ancestor);

    stubRect(ancestor, 100, 200);
    stubRect(container, 0, 1000);

    const bounds = getReorderVisibleBounds(container);

    // The container's own rect (clamped to the viewport) still applies; the ancestor
    // never narrows it because it does not clip.
    expect(bounds.top).toBe(0);
    expect(bounds.bottom).toBeGreaterThan(200);
  });

  it('intersects across multiple clipping ancestors', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const container = document.createElement('div');

    outer.style.overflow = 'hidden';
    inner.style.overflow = 'scroll';
    outer.appendChild(inner);
    inner.appendChild(container);
    document.body.appendChild(outer);

    stubRect(outer, 0, 500);
    stubRect(inner, 100, 300);
    stubRect(container, -50, 1000);

    const bounds = getReorderVisibleBounds(container);

    expect(bounds.top).toBe(100);
    expect(bounds.bottom).toBe(300);
  });

  it('clamps to the viewport height when the container extends past it', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);
    stubRect(container, -100, 100_000);

    const bounds = getReorderVisibleBounds(container);

    expect(bounds.top).toBe(0);
    expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);
  });

  it('collapses to an empty area instead of a negative range when fully clipped offscreen', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');

    ancestor.style.overflow = 'hidden';
    ancestor.appendChild(container);
    document.body.appendChild(ancestor);

    stubRect(ancestor, 0, 20); // clipping ancestor sits entirely above the container
    stubRect(container, 100, 200);

    const bounds = getReorderVisibleBounds(container);

    expect(bounds.bottom).toBeGreaterThanOrEqual(bounds.top);
  });
});
