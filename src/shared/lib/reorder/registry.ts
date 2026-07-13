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
  /**
   * Elements marked with `vReorderActivator`. Ownership is resolved on demand by walking up to
   * the nearest registered item ancestor (see {@link findActivatorOwner}), never by a stored key,
   * so an item never needs a second registered identity for its activators. This means an
   * activator nested inside a registered *child* item belongs to that child alone, never to an
   * enclosing registered parent.
   */
  activatorEls: Set<Element>;
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
  activatorEls: new Set(),
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
 * Resolves the registered item that owns `activatorEl`: its nearest registered item ancestor.
 * Ownership walks up from the activator itself, so an activator nested inside a registered child
 * item resolves to that child even when an enclosing registered parent's subtree also contains it.
 * @param registry - The instance registry to search.
 * @param containerEl - The reorder container element bounding the search.
 * @param activatorEl - A registered `vReorderActivator` element.
 * @returns The activator's owning registered item, or `null` when none is found within the
 * container.
 */
const findActivatorOwner = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  containerEl: Element,
  activatorEl: Element,
): RegisteredTarget<Key> | null => findRegisteredAncestor(registry, containerEl, activatorEl);

/**
 * @param registry - The instance registry to search.
 * @param containerEl - The reorder container element bounding the search.
 * @param item - A resolved registered item.
 * @returns Whether `item` owns at least one registered `vReorderActivator` element, i.e. an
 * activator whose nearest registered item ancestor is `item` itself. An activator nested inside a
 * registered child item never counts toward an enclosing registered parent, even though the
 * child's DOM is structurally contained within the parent's subtree.
 */
const hasRegisteredActivator = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  containerEl: Element,
  item: RegisteredTarget<Key>,
): boolean => {
  for (const activatorEl of registry.activatorEls) {
    if (findActivatorOwner(registry, containerEl, activatorEl)?.element === item.element) {
      return true;
    }
  }

  return false;
};

/**
 * Walks from `startNode` up to and including `containerEl`, resolving the registered item that
 * would own a would-be drag activation.
 *
 * Once a registered item ancestor is found, the walk continues only up to that item's own root
 * (not further toward `containerEl`) to decide activation for it:
 * - A `vReorderIgnore` marker anywhere on that bounded path always blocks activation, whether or
 *   not the item has an activator.
 * - When the item owns no `vReorderActivator` (the default), a standard native interactive
 *   element anywhere on the path blocks activation, exactly as before.
 * - When the item owns one or more `vReorderActivator` elements, activation requires the path to
 *   pass through one of them; native interactive elements are permitted inside a matching
 *   activator.
 *
 * Returns `null` when no registered item is found within `containerEl`, or when the item's
 * activation rule above is not satisfied.
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
  const item = findRegisteredAncestor(registry, containerEl, startNode);
  if (!item) return null;

  const requiresActivator = hasRegisteredActivator(registry, containerEl, item);
  let matchedActivator = false;

  let current: Node | null = startNode;

  while (current instanceof Element) {
    if (registry.ignoreEls.has(current)) return null;

    if (requiresActivator) {
      if (
        registry.activatorEls.has(current) &&
        findActivatorOwner(registry, containerEl, current)?.element === item.element
      ) {
        matchedActivator = true;
      }
    } else if (isInteractiveElement(current)) {
      return null;
    }

    if (current === item.element) break;

    current = current.parentElement;
  }

  if (requiresActivator && !matchedActivator) return null;

  return item;
};
