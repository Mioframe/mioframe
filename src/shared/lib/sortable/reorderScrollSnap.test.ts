import { afterEach, describe, expect, it } from 'vitest';
import { suspendAncestorScrollSnap } from './reorderScrollSnap';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('suspendAncestorScrollSnap', () => {
  it('suspends and restores scroll-snap-type on a snapping ancestor', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');

    ancestor.style.scrollSnapType = 'y proximity';
    ancestor.appendChild(container);
    document.body.appendChild(ancestor);

    const restore = suspendAncestorScrollSnap(container);

    expect(ancestor.style.scrollSnapType).toBe('none');

    restore();

    expect(ancestor.style.scrollSnapType).toBe('y proximity');
  });

  it('leaves non-snapping ancestors untouched', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');

    ancestor.appendChild(container);
    document.body.appendChild(ancestor);

    const restore = suspendAncestorScrollSnap(container);

    expect(ancestor.style.scrollSnapType).toBe('');

    restore();

    expect(ancestor.style.scrollSnapType).toBe('');
  });

  it('suspends every snapping ancestor up the tree, innermost and outermost', () => {
    const outer = document.createElement('div');
    const middle = document.createElement('div');
    const container = document.createElement('div');

    outer.style.scrollSnapType = 'y mandatory';
    middle.style.scrollSnapType = 'y proximity';
    outer.appendChild(middle);
    middle.appendChild(container);
    document.body.appendChild(outer);

    const restore = suspendAncestorScrollSnap(container);

    expect(outer.style.scrollSnapType).toBe('none');
    expect(middle.style.scrollSnapType).toBe('none');

    restore();

    expect(outer.style.scrollSnapType).toBe('y mandatory');
    expect(middle.style.scrollSnapType).toBe('y proximity');
  });

  it('is idempotent-safe to call restore only once', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');

    ancestor.style.scrollSnapType = 'x proximity';
    ancestor.appendChild(container);
    document.body.appendChild(ancestor);

    const restore = suspendAncestorScrollSnap(container);

    restore();
    restore();

    expect(ancestor.style.scrollSnapType).toBe('x proximity');
  });
});
