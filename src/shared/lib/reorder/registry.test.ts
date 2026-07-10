import { afterEach, describe, expect, it } from 'vitest';
import {
  createReorderRegistry,
  findRegisteredAncestor,
  isInteractiveElement,
  registerItem,
  resolveActivationTarget,
  unregisterItem,
} from './registry';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('registerItem / unregisterItem', () => {
  it('registers a key/element pair in both directions', () => {
    const registry = createReorderRegistry<string>();
    const el = document.createElement('div');

    registerItem(registry, 'a', el);

    expect(registry.itemElements.get('a')).toBe(el);
    expect(registry.itemKeys.get(el)).toBe('a');
  });

  it('overwrites a duplicate key registration and cleans up the stale reverse mapping', () => {
    const registry = createReorderRegistry<string>();
    const firstEl = document.createElement('div');
    const secondEl = document.createElement('div');

    registerItem(registry, 'a', firstEl);
    registerItem(registry, 'a', secondEl);

    expect(registry.itemElements.get('a')).toBe(secondEl);
    expect(registry.itemKeys.get(secondEl)).toBe('a');
    expect(registry.itemKeys.has(firstEl)).toBe(false);
  });

  it('does not unregister when a newer registration already replaced the entry', () => {
    const registry = createReorderRegistry<string>();
    const firstEl = document.createElement('div');
    const secondEl = document.createElement('div');

    registerItem(registry, 'a', firstEl);
    registerItem(registry, 'a', secondEl);
    // Simulates an out-of-order unmount of the stale first element.
    unregisterItem(registry, 'a', firstEl);

    expect(registry.itemElements.get('a')).toBe(secondEl);
    expect(registry.itemKeys.get(secondEl)).toBe('a');
  });

  it('unregisters a matching key/element pair', () => {
    const registry = createReorderRegistry<string>();
    const el = document.createElement('div');

    registerItem(registry, 'a', el);
    unregisterItem(registry, 'a', el);

    expect(registry.itemElements.has('a')).toBe(false);
    expect(registry.itemKeys.has(el)).toBe(false);
  });
});

describe('isInteractiveElement', () => {
  it.each(['button', 'a', 'input', 'textarea', 'select'])(
    'treats a native <%s> as interactive',
    (tagName) => {
      expect(isInteractiveElement(document.createElement(tagName))).toBe(true);
    },
  );

  it('treats an editable-content host as interactive', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'isContentEditable', { value: true, configurable: true });

    expect(isInteractiveElement(el)).toBe(true);
  });

  it('does not treat an ordinary element as interactive', () => {
    expect(isInteractiveElement(document.createElement('div'))).toBe(false);
  });
});

describe('findRegisteredAncestor', () => {
  it('finds the registered item ancestor of a deeply nested node', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const nested = document.createElement('span');

    item.append(nested);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);

    const result = findRegisteredAncestor(registry, container, nested);

    expect(result).toEqual({ key: 'a', element: item });
  });

  it('returns null when nothing registered is found within the container boundary', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const nested = document.createElement('span');

    container.append(nested);
    document.body.append(container);

    expect(findRegisteredAncestor(registry, container, nested)).toBeNull();
  });

  it('does not block on ignore/interactive elements (used for live hit-test retargeting)', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const button = document.createElement('button');

    item.append(button);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.ignoreEls.add(button);

    expect(findRegisteredAncestor(registry, container, button)).toEqual({
      key: 'a',
      element: item,
    });
  });
});

describe('resolveActivationTarget', () => {
  it('resolves the registered item for a plain descendant', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const handle = document.createElement('span');

    item.append(handle);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);

    expect(resolveActivationTarget(registry, container, handle)).toEqual({
      key: 'a',
      element: item,
    });
  });

  it('blocks activation starting on a standard interactive descendant', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const button = document.createElement('button');

    item.append(button);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);

    expect(resolveActivationTarget(registry, container, button)).toBeNull();
  });

  it('blocks activation starting inside a vReorderIgnore-marked descendant', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const ignored = document.createElement('div');
    const nested = document.createElement('span');

    ignored.append(nested);
    item.append(ignored);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.ignoreEls.add(ignored);

    expect(resolveActivationTarget(registry, container, nested)).toBeNull();
  });

  it('returns null when no registered item exists on the path to the container', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const loose = document.createElement('span');

    container.append(loose);
    document.body.append(container);

    expect(resolveActivationTarget(registry, container, loose)).toBeNull();
  });
});
