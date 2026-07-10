/**
 * Public composable entry point: wires the registry, pointer session, and
 * directives together and exposes the reactive `draggingKey` state.
 */
import { tryOnScopeDispose } from '@vueuse/core';
import { customRef, toValue, type Ref } from 'vue';
import { DEFAULT_LONG_PRESS_DELAY_MS } from './constants';
import { createReorderDirectives } from './directives';
import { createPointerSession } from './PointerSession';
import { createReorderRegistry } from './registry';
import type { ReorderKey, UseReorderOptions, UseReorderReturn } from './types';

/**
 * `ref<Key | null>(null)` resolves to a union of Vue's literal-narrowing `ref` overloads when
 * `Key` is an unresolved generic, which TypeScript then rejects on assignment back to
 * `Ref<Key | null>`. `customRef` has a single generic signature and sidesteps that limitation
 * while keeping standard ref reactivity (no deep unwrap is needed for a primitive key anyway).
 * @returns A plain `Ref<Key | null>`, initialized to `null`.
 */
const createDraggingKeyRef = <Key extends ReorderKey>(): Ref<Key | null> => {
  let value: Key | null = null;

  return customRef<Key | null>((track, trigger) => ({
    get() {
      track();
      return value;
    },
    set(newValue) {
      value = newValue;
      trigger();
    },
  }));
};

/**
 * Enables live pointer-driven reordering for a consumer-owned list of keys.
 *
 * The consumer stays the single source of truth for order: this composable never mutates `keys`
 * and never infers item identity from array indexes or DOM position. Apply the returned
 * `vReorderContainer` directive once on the list container and `vReorderItem="item.key"` on each
 * reorderable item's root element; see the module README for the full contract.
 * @param options - The controlled keys, required `onReorder` callback, and optional callbacks.
 * @returns The reactive `draggingKey` and the three local reorder directives.
 */
export const useReorder = <Key extends ReorderKey = ReorderKey>(
  options: UseReorderOptions<Key>,
): UseReorderReturn<Key> => {
  const registry = createReorderRegistry<Key>();
  const draggingKey = createDraggingKeyRef<Key>();

  const session = createPointerSession<Key>({
    registry,
    getKeys: () => toValue(options.keys),
    getLongPressDelay: () => options.longPressDelay ?? DEFAULT_LONG_PRESS_DELAY_MS,
    draggingKey,
    onReorder: options.onReorder,
    onDragStart: options.onDragStart,
    onDragEnd: options.onDragEnd,
  });

  const { vReorderContainer, vReorderItem, vReorderIgnore } = createReorderDirectives(
    registry,
    session,
  );

  tryOnScopeDispose(() => {
    session.dispose();
  });

  return {
    draggingKey,
    vReorderContainer,
    vReorderItem,
    vReorderIgnore,
  };
};
