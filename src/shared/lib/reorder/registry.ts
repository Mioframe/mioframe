/**
 * Per-`useReorder`-instance registration store: the container element, the
 * registered item elements keyed by consumer key, and elements marked with
 * `vReorderIgnore`. Directives in `directives.ts` write to this store;
 * `PointerSession.ts` and `hitTest.ts` read from it.
 */
import { REORDER_INTERACTIVE_TAG_NAMES } from './constants';
import { reorderInvariant } from './invariant';
import type { ReorderKey } from './types';

/** The registration state owned by a single `useReorder` instance. */
export interface ReorderRegistry<Key extends ReorderKey> {
  /** The element registered through `vReorderContainer`, or `null` before mount. */
  containerEl: HTMLElement | null;
  /** Registered item elements keyed by the consumer-supplied key. */
  itemElements: Map<Key, HTMLElement>;
  /** The reverse lookup from a registered item element back to its key. */
  itemKeys: Map<Element, Key>;
  /** Elements marked with `vReorderIgnore`. */
  ignoreEls: Set<Element>;
}

/**
 * Creates an empty registry for one `useReorder` instance.
 * @returns A fresh, empty registry.
 */
export const createReorderRegistry = <Key extends ReorderKey>(): ReorderRegistry<Key> => ({
  containerEl: null,
  itemElements: new Map(),
  itemKeys: new Map(),
  ignoreEls: new Set(),
});

/**
 * Registers `el` under `key`. Registering a second, different element under an already-registered
 * key, or registering the same element under a second, different key, is a consumer contract
 * violation (duplicate identities are programmer errors, not supported runtime states) and throws
 * instead of silently letting the most recently mounted registration win.
 * @param registry - The instance registry to update.
 * @param key - The consumer-supplied item key.
 * @param el - The measurable element for `key`.
 * @throws When `key` is already registered to a different element, or `el` is already registered
 * under a different key.
 */
export const registerItem = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  key: Key,
  el: HTMLElement,
): void => {
  const existingElForKey = registry.itemElements.get(key);
  reorderInvariant(
    !existingElForKey || existingElForKey === el,
    'an item key is already registered to another element.',
  );

  const existingKeyForEl = registry.itemKeys.get(el);
  reorderInvariant(
    existingKeyForEl === undefined || existingKeyForEl === key,
    'an element is already registered under another key.',
  );

  registry.itemElements.set(key, el);
  registry.itemKeys.set(el, key);
};

/**
 * Removes the registration for `key`/`el`, but only when they still match the registry's current
 * entry, so an out-of-order unmount cannot clobber a newer registration for the same key.
 * @param registry - The instance registry to update.
 * @param key - The consumer-supplied item key being unregistered.
 * @param el - The element that was registered for `key`.
 */
export const unregisterItem = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  key: Key,
  el: HTMLElement,
): void => {
  if (registry.itemElements.get(key) === el) {
    registry.itemElements.delete(key);
  }

  if (registry.itemKeys.get(el) === key) {
    registry.itemKeys.delete(el);
  }
};

/**
 * @param el - The element to check.
 * @returns Whether `el` is a standard interactive element (button, link, form control) or an
 * editable-content host, where drag activation must not begin.
 */
export const isInteractiveElement = (el: Element): boolean =>
  REORDER_INTERACTIVE_TAG_NAMES.has(el.tagName) ||
  (el instanceof HTMLElement && el.isContentEditable);

/** A resolved registered item: its key and its registered measurable element. */
export interface RegisteredTarget<Key extends ReorderKey> {
  /** The item's consumer-supplied key. */
  key: Key;
  /** The item's registered measurable element. */
  element: HTMLElement;
}

/**
 * Walks from `startNode` up to and including `containerEl`, returning the first registered item
 * ancestor found. Does not consider `vReorderIgnore` or interactive elements; used for hit-test
 * target resolution where those exclusions only apply to drag activation, not live retargeting.
 * @param registry - The instance registry to search.
 * @param containerEl - The reorder container element bounding the search.
 * @param startNode - The node to start walking up from.
 * @returns The first registered ancestor item, or `null` when none is found within the container.
 */
export const findRegisteredAncestor = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  containerEl: Element,
  startNode: Node | null,
): RegisteredTarget<Key> | null => {
  let current: Node | null = startNode;

  while (current instanceof Element) {
    const key = registry.itemKeys.get(current);

    if (key !== undefined) {
      const element = registry.itemElements.get(key);
      if (element) return { key, element };
    }

    if (current === containerEl) return null;

    current = current.parentElement;
  }

  return null;
};

/**
 * Walks from `startNode` up to and including `containerEl`, resolving the registered item that
 * would own a would-be drag activation. Returns `null` when a `vReorderIgnore` marker or a
 * standard interactive element is encountered before reaching a registered item, or when no
 * registered item is found.
 * @param registry - The instance registry to search.
 * @param containerEl - The reorder container element bounding the search.
 * @param startNode - The original pointerdown event target to start walking up from.
 * @returns The activation target, or `null` when activation must not start.
 */
export const resolveActivationTarget = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  containerEl: Element,
  startNode: Node | null,
): RegisteredTarget<Key> | null => {
  let current: Node | null = startNode;

  while (current instanceof Element) {
    if (registry.ignoreEls.has(current) || isInteractiveElement(current)) return null;

    const key = registry.itemKeys.get(current);

    if (key !== undefined) {
      const element = registry.itemElements.get(key);
      if (element) return { key, element };
    }

    if (current === containerEl) return null;

    current = current.parentElement;
  }

  return null;
};
