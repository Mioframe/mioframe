/**
 * The three local Vue directives returned by `useReorder`: container and item
 * registration, plus interactive-descendant exclusion. Registration writes
 * into the shared per-instance registry; activation stays owned by the
 * pointer session.
 */
import type { Directive } from 'vue';
import { reorderInvariant } from './invariant';
import type { PointerSession } from './PointerSession';
import { registerItem, unregisterItem, type ReorderRegistry } from './registry';
import type { ReorderKey } from './types';

/** The three local directives for one `useReorder` instance. */
export interface ReorderDirectives<Key extends ReorderKey> {
  /** Registers the reorder container element. */
  vReorderContainer: Directive<HTMLElement>;
  /** Registers a reorderable item element under its consumer-supplied key. */
  vReorderItem: Directive<HTMLElement, Key>;
  /** Excludes a custom interactive descendant from starting drag activation. */
  vReorderIgnore: Directive<HTMLElement>;
}

/**
 * Builds the three local directives for one `useReorder` instance, wired to its registry and
 * pointer session.
 * @param registry - The instance's registration store.
 * @param session - The instance's pointer session controller.
 * @returns The bound directive objects.
 */
export const createReorderDirectives = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  session: PointerSession<Key>,
): ReorderDirectives<Key> => {
  const vReorderContainer: Directive<HTMLElement> = {
    mounted(el) {
      reorderInvariant(
        registry.containerEl === null,
        'only one reorder container may be mounted per useReorder instance.',
      );
      registry.containerEl = el;
      session.attachContainer(el);
    },
    unmounted(el) {
      // Ownership guard first: an out-of-order unmount for a stale element must be a no-op,
      // never reaching `detachContainer` and cancelling a session a newer container now owns.
      if (registry.containerEl !== el) return;

      try {
        session.detachContainer(el);
      } finally {
        // Hard cleanup boundary: registry ownership must not survive a failed detach, even when
        // `detachContainer` throws (a consumer-owned `getKeys`/`onReorder`/`onDragEnd` call during
        // cancellation is outside the library's trust boundary).
        registry.containerEl = null;
        registry.itemElements.clear();
        registry.itemKeys.clear();
        registry.ignoreEls.clear();
      }
    },
  };

  const vReorderItem: Directive<HTMLElement, Key> = {
    mounted(el, binding) {
      registerItem(registry, binding.value, el);
    },
    updated(el, binding) {
      if (binding.value === binding.oldValue) return;

      if (binding.oldValue !== null) unregisterItem(registry, binding.oldValue, el);

      registerItem(registry, binding.value, el);
    },
    unmounted(el, binding) {
      unregisterItem(registry, binding.value, el);
      session.notifyItemUnmounted(binding.value);
    },
  };

  const vReorderIgnore: Directive<HTMLElement> = {
    mounted(el) {
      registry.ignoreEls.add(el);
    },
    unmounted(el) {
      registry.ignoreEls.delete(el);
    },
  };

  return { vReorderContainer, vReorderItem, vReorderIgnore };
};
