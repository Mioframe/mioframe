/**
 * Public composable entry point: wires the registry, pointer session, and
 * directives together and exposes the reactive `draggingKey` state.
 */
import { tryOnScopeDispose } from '@vueuse/core';
import { shallowRef, toValue, type Ref } from 'vue';
import { DEFAULT_LONG_PRESS_DELAY_MS } from './constants';
import { createReorderDirectives } from './directives';
import { createPointerSession } from './PointerSession';
import { createReorderRegistry } from './registry';
import type { ReorderKey, UseReorderOptions, UseReorderReturn } from './types';

/**
 * Enables live pointer-driven reordering for a consumer-owned list of keys.
 *
 * The consumer stays the single source of truth for order: this composable never mutates `keys`
 * and never infers item identity from array indexes or DOM position. Apply the returned
 * `vReorderContainer` directive once on the list container and `vReorderItem="item.key"` on each
 * reorderable item's root element; see the module README for the full contract.
 * @param options - The controlled keys, required `onReorder` callback, and optional callbacks.
 * @returns The reactive `draggingKey` and the four local reorder directives.
 */
export const useReorder = <Key extends ReorderKey = ReorderKey>(
  options: UseReorderOptions<Key>,
): UseReorderReturn<Key> => {
  const registry = createReorderRegistry<Key>();
  const draggingKey: Ref<Key | null> = shallowRef<Key | null>(null);

  const session = createPointerSession<Key>({
    registry,
    getKeys: () => toValue(options.keys),
    getLongPressDelay: () => options.longPressDelay ?? DEFAULT_LONG_PRESS_DELAY_MS,
    draggingKey,
    onReorder: options.onReorder,
    onDragStart: options.onDragStart,
    onDragEnd: options.onDragEnd,
  });

  const { vReorderContainer, vReorderItem, vReorderActivator, vReorderIgnore } =
    createReorderDirectives(registry, session);

  tryOnScopeDispose(() => {
    session.dispose();
  });

  return {
    draggingKey,
    vReorderContainer,
    vReorderItem,
    vReorderActivator,
    vReorderIgnore,
  };
};
