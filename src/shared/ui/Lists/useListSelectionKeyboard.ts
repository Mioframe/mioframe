import { nextTick, onMounted, onUnmounted, onUpdated, type Ref } from 'vue';
import type { MDListSelectionRegistry } from './listContext';
import {
  focusListSelectionItem,
  getNextEnabledListSelectionItem,
  syncListSelectionItemTabStops,
} from './listSelectionItemNavigation';

/**
 * Wires roving keyboard navigation and tab-stop synchronization for a listbox
 * container. Only active when `enabled` is true (i.e. when selectionMode !== 'none').
 * @param getContainer - Returns the live container element, or null when unmounted.
 * @param enabled - Whether to attach keyboard navigation (false = selection mode is none).
 * @param selectionRegistry - Vue-owned option registry for the current MDList instance.
 */
export const useListSelectionKeyboard = (
  getContainer: () => HTMLElement | null,
  enabled: Ref<boolean>,
  selectionRegistry: MDListSelectionRegistry,
) => {
  const moveFocus = (event: KeyboardEvent, direction: 'first' | 'last' | 1 | -1) => {
    if (!enabled.value) {
      return;
    }

    const container = getContainer();
    const currentTarget = event.target;

    if (!(container && currentTarget instanceof HTMLElement)) {
      return;
    }

    const nextItem = getNextEnabledListSelectionItem(selectionRegistry, currentTarget, direction);

    if (!nextItem) {
      return;
    }

    event.preventDefault();
    focusListSelectionItem(selectionRegistry, nextItem);
  };

  const handleFocusin = (event: Event) => {
    if (
      !enabled.value ||
      !(event instanceof FocusEvent) ||
      !(event.target instanceof HTMLElement)
    ) {
      return;
    }

    const focusTarget = event.target;

    const item =
      selectionRegistry
        .getItems()
        .map((record) => record.getElement())
        .find(
          (element): element is HTMLElement =>
            element instanceof HTMLElement &&
            (element === focusTarget || element.contains(focusTarget)),
        ) ?? null;

    if (item) {
      focusListSelectionItem(selectionRegistry, item);
    }
  };

  const handleKeydown = (event: Event) => {
    if (!enabled.value || !(event instanceof KeyboardEvent)) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        moveFocus(event, 1);
        return;
      case 'ArrowUp':
        moveFocus(event, -1);
        return;
      case 'Home':
        moveFocus(event, 'first');
        return;
      case 'End':
        moveFocus(event, 'last');
        return;
    }
  };

  const syncTabStops = () => {
    const container = getContainer();
    if (container) {
      syncListSelectionItemTabStops(selectionRegistry);
    }
  };

  onMounted(() => {
    const container = getContainer();
    container?.addEventListener('focusin', handleFocusin);
    container?.addEventListener('keydown', handleKeydown);
    void nextTick(syncTabStops);
  });

  onUnmounted(() => {
    const container = getContainer();
    container?.removeEventListener('focusin', handleFocusin);
    container?.removeEventListener('keydown', handleKeydown);
  });

  onUpdated(() => {
    void nextTick(syncTabStops);
  });
};
