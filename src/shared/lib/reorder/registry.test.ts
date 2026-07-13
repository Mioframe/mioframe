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

  it('re-registering the same key/element pair is idempotent', () => {
    const registry = createReorderRegistry<string>();
    const el = document.createElement('div');

    registerItem(registry, 'a', el);
    registerItem(registry, 'a', el);

    expect(registry.itemElements.get('a')).toBe(el);
    expect(registry.itemKeys.get(el)).toBe('a');
  });

  it('throws when a key is registered to a second, different element while the first is still mounted', () => {
    const registry = createReorderRegistry<string>();
    const firstEl = document.createElement('div');
    const secondEl = document.createElement('div');

    registerItem(registry, 'a', firstEl);

    expect(() => {
      registerItem(registry, 'a', secondEl);
    }).toThrow(/already registered to another element/);
    expect(registry.itemElements.get('a')).toBe(firstEl);
  });

  it('throws when one element is registered under a second, different key', () => {
    const registry = createReorderRegistry<string>();
    const el = document.createElement('div');

    registerItem(registry, 'a', el);

    expect(() => {
      registerItem(registry, 'b', el);
    }).toThrow(/already registered under another key/);
    expect(registry.itemKeys.get(el)).toBe('a');
  });

  it('allows re-registering an element under a new key once the old key was unregistered first', () => {
    const registry = createReorderRegistry<string>();
    const el = document.createElement('div');

    registerItem(registry, 'a', el);
    unregisterItem(registry, 'a', el);
    registerItem(registry, 'b', el);

    expect(registry.itemKeys.get(el)).toBe('b');
    expect(registry.itemElements.has('a')).toBe(false);
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

describe('resolveActivationTarget with vReorderActivator', () => {
  it('resolves a native button inside a matching activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const activator = document.createElement('div');
    const button = document.createElement('button');

    activator.append(button);
    item.append(activator);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(activator);

    expect(resolveActivationTarget(registry, container, button)).toEqual({
      key: 'a',
      element: item,
    });
  });

  it('does not resolve a non-activator part of an item that has an activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const activator = document.createElement('div');
    const otherContent = document.createElement('span');

    item.append(activator, otherContent);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(activator);

    expect(resolveActivationTarget(registry, container, otherContent)).toBeNull();
  });

  it('resolves full-row activation when the item root is itself the activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const label = document.createElement('span');

    item.append(label);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(item);

    expect(resolveActivationTarget(registry, container, label)).toEqual({
      key: 'a',
      element: item,
    });
  });

  it('blocks activation on vReorderIgnore inside an activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const activator = document.createElement('div');
    const ignored = document.createElement('div');
    const nested = document.createElement('span');

    ignored.append(nested);
    activator.append(ignored);
    item.append(activator);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(activator);
    registry.ignoreEls.add(ignored);

    expect(resolveActivationTarget(registry, container, nested)).toBeNull();
  });

  it('keeps an unmarked trailing sibling button blocked when the item has an activator elsewhere', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const activator = document.createElement('div');
    const trailingButton = document.createElement('button');

    item.append(activator, trailingButton);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(activator);

    expect(resolveActivationTarget(registry, container, trailingButton)).toBeNull();
  });

  it('supports multiple activators registered on the same item', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const firstActivator = document.createElement('div');
    const secondActivator = document.createElement('div');

    item.append(firstActivator, secondActivator);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(firstActivator);
    registry.activatorEls.add(secondActivator);

    expect(resolveActivationTarget(registry, container, firstActivator)).toEqual({
      key: 'a',
      element: item,
    });
    expect(resolveActivationTarget(registry, container, secondActivator)).toEqual({
      key: 'a',
      element: item,
    });
  });

  it('does not let an activator belonging to a different item authorize this item', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const itemA = document.createElement('div');
    const activatorA = document.createElement('div');
    const itemB = document.createElement('div');
    const contentB = document.createElement('span');

    itemA.append(activatorA);
    itemB.append(contentB);
    container.append(itemA, itemB);
    document.body.append(container);
    registerItem(registry, 'a', itemA);
    registerItem(registry, 'b', itemB);
    registry.activatorEls.add(activatorA);

    // itemB owns no activator of its own, but registry-wide activatorEls contains one that
    // belongs to itemA. itemB must still use its own default (no-activator) activation rule.
    expect(resolveActivationTarget(registry, container, contentB)).toEqual({
      key: 'b',
      element: itemB,
    });

    const buttonInB = document.createElement('button');
    contentB.append(buttonInB);
    expect(resolveActivationTarget(registry, container, buttonInB)).toBeNull();
  });

  it('a nested child activator belongs to the child item only, not the enclosing parent', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const child = document.createElement('div');
    const childHandle = document.createElement('button');

    child.append(childHandle);
    parent.append(child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);
    registry.activatorEls.add(childHandle);

    expect(resolveActivationTarget(registry, container, childHandle)).toEqual({
      key: 'child',
      element: child,
    });
  });

  it('does not put the parent into strict activator mode because of a nested child activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const parentContent = document.createElement('span');
    const child = document.createElement('div');
    const childHandle = document.createElement('button');

    child.append(childHandle);
    parent.append(parentContent, child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);
    registry.activatorEls.add(childHandle);

    // Parent non-interactive content still resolves through the default (no-activator) behavior.
    expect(resolveActivationTarget(registry, container, parentContent)).toEqual({
      key: 'parent',
      element: parent,
    });
  });

  it('keeps a parent native control blocked when the parent owns no activator of its own', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const parentButton = document.createElement('button');
    const child = document.createElement('div');
    const childHandle = document.createElement('button');

    child.append(childHandle);
    parent.append(parentButton, child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);
    registry.activatorEls.add(childHandle);

    expect(resolveActivationTarget(registry, container, parentButton)).toBeNull();
  });

  it('lets an independent parent activator and child activator each own only their own item', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const parentHandle = document.createElement('button');
    const child = document.createElement('div');
    const childHandle = document.createElement('button');

    child.append(childHandle);
    parent.append(parentHandle, child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);
    registry.activatorEls.add(parentHandle);
    registry.activatorEls.add(childHandle);

    expect(resolveActivationTarget(registry, container, parentHandle)).toEqual({
      key: 'parent',
      element: parent,
    });
    expect(resolveActivationTarget(registry, container, childHandle)).toEqual({
      key: 'child',
      element: child,
    });
  });

  it('resolves the nested child, never the parent, for a pointer target inside the child', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const child = document.createElement('div');
    const childContent = document.createElement('span');

    child.append(childContent);
    parent.append(child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);

    expect(resolveActivationTarget(registry, container, childContent)).toEqual({
      key: 'child',
      element: child,
    });
  });

  it('vReorderIgnore still wins inside a nested child item under a parent activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const child = document.createElement('div');
    const ignored = document.createElement('span');

    child.append(ignored);
    parent.append(child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);
    registry.activatorEls.add(child);
    registry.ignoreEls.add(ignored);

    expect(resolveActivationTarget(registry, container, ignored)).toBeNull();
  });

  it('vReorderIgnore still wins inside a parent item alongside an unrelated child activator', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const parent = document.createElement('div');
    const ignored = document.createElement('span');
    const child = document.createElement('div');
    const childHandle = document.createElement('button');

    child.append(childHandle);
    parent.append(ignored, child);
    container.append(parent);
    document.body.append(container);
    registerItem(registry, 'parent', parent);
    registerItem(registry, 'child', child);
    registry.activatorEls.add(childHandle);
    registry.ignoreEls.add(ignored);

    expect(resolveActivationTarget(registry, container, ignored)).toBeNull();
  });

  it('leaves findRegisteredAncestor unaffected by registered activators', () => {
    const registry = createReorderRegistry<string>();
    const container = document.createElement('div');
    const item = document.createElement('div');
    const activator = document.createElement('div');
    const button = document.createElement('button');

    activator.append(button);
    item.append(activator);
    container.append(item);
    document.body.append(container);
    registerItem(registry, 'a', item);
    registry.activatorEls.add(activator);

    // findRegisteredAncestor is used for live hit-test retargeting and must ignore activator
    // membership entirely, resolving through a native interactive element the same way it
    // already does for vReorderIgnore.
    expect(findRegisteredAncestor(registry, container, button)).toEqual({
      key: 'a',
      element: item,
    });
  });
});
