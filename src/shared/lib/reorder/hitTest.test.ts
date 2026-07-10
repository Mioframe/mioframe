import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEffectiveHitTestPoint, resolveHitTestTarget } from './hitTest';
import { createReorderRegistry, registerItem } from './registry';

afterEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(document, 'elementsFromPoint');
});

describe('getEffectiveHitTestPoint', () => {
  it('clamps the raw pointer point to the container visible rect', () => {
    const point = getEffectiveHitTestPoint(
      { left: 0, top: 0, width: 100, height: 100 },
      {
        x: -10,
        y: 500,
      },
    );

    expect(point).toEqual({ x: 0, y: 100 });
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
