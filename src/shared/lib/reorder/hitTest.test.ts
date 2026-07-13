import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEffectiveHitTestPoint, resolveHitTestTarget } from './hitTest';
import { createReorderRegistry, registerItem } from './registry';

afterEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(document, 'elementsFromPoint');
});

describe('getEffectiveHitTestPoint', () => {
  it('clamps a point beyond the left/top edge inward to the edge itself', () => {
    const point = getEffectiveHitTestPoint(
      { left: 0, top: 0, width: 100, height: 100 },
      { x: -10, y: -20 },
    );

    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('clamps a point beyond the right/bottom edge to strictly inside the rect', () => {
    const point = getEffectiveHitTestPoint(
      { left: 0, top: 0, width: 100, height: 100 },
      { x: 500, y: 500 },
    );

    expect(point).not.toBeNull();
    expect(point?.x).toBeLessThan(100);
    expect(point?.y).toBeLessThan(100);
    expect(point?.x).toBeGreaterThan(99);
    expect(point?.y).toBeGreaterThan(99);
  });

  it('returns a point exactly on the left/top edge unchanged (inclusive minimum)', () => {
    const point = getEffectiveHitTestPoint(
      { left: 10, top: 20, width: 100, height: 100 },
      { x: 10, y: 20 },
    );

    expect(point).toEqual({ x: 10, y: 20 });
  });

  it('leaves an interior point untouched', () => {
    const point = getEffectiveHitTestPoint(
      { left: 0, top: 0, width: 100, height: 100 },
      { x: 40, y: 60 },
    );

    expect(point).toEqual({ x: 40, y: 60 });
  });

  it('returns null for a zero-width visible rect', () => {
    expect(
      getEffectiveHitTestPoint({ left: 0, top: 0, width: 0, height: 100 }, { x: 5, y: 5 }),
    ).toBeNull();
  });

  it('returns null for a zero-height visible rect', () => {
    expect(
      getEffectiveHitTestPoint({ left: 0, top: 0, width: 100, height: 0 }, { x: 5, y: 5 }),
    ).toBeNull();
  });

  it('returns null for a fully collapsed (zero-width and zero-height) visible rect', () => {
    expect(
      getEffectiveHitTestPoint({ left: 10, top: 10, width: 0, height: 0 }, { x: 10, y: 10 }),
    ).toBeNull();
  });
});

describe('resolveHitTestTarget', () => {
  it('resolves the topmost registered item candidate within the container', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const itemA = document.createElement('div');
    const itemB = document.createElement('div');

    container.append(itemA, itemB);
    document.body.append(container);
    registerItem(registry, 'a', itemA);
    registerItem(registry, 'b', itemB);

    document.elementsFromPoint = vi.fn(() => [
      itemB,
      container,
      document.body,
      document.documentElement,
    ]);

    const result = resolveHitTestTarget(registry, container, { x: 1, y: 1 }, 'a');

    expect(result).toEqual({ key: 'b', element: itemB });
  });

  it('excludes the active item from candidates', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const itemA = document.createElement('div');

    container.append(itemA);
    document.body.append(container);
    registerItem(registry, 'a', itemA);

    document.elementsFromPoint = vi.fn(() => [itemA, container]);

    expect(resolveHitTestTarget(registry, container, { x: 1, y: 1 }, 'a')).toBeNull();
  });

  it('ignores candidates outside the container', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const outsideItem = document.createElement('div');

    document.body.append(container, outsideItem);
    registerItem(registry, 'outside', outsideItem);

    document.elementsFromPoint = vi.fn(() => [outsideItem, document.body]);

    expect(resolveHitTestTarget(registry, container, { x: 1, y: 1 }, 'a')).toBeNull();
  });

  it('returns null when no registered item is under the point', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');

    document.body.append(container);

    document.elementsFromPoint = vi.fn(() => [container, document.body]);

    expect(resolveHitTestTarget(registry, container, { x: 1, y: 1 }, 'a')).toBeNull();
  });
});
