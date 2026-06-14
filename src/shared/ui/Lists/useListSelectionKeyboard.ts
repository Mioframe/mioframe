import { nextTick, onMounted, onUnmounted, onUpdated, type Ref } from 'vue';
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
 */
export const useListSelectionKeyboard = (
  getContainer: () => HTMLElement | null,
  enabled: Ref<boolean>,
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

    const nextItem = getNextEnabledListSelectionItem(container, currentTarget, direction);

    if (!nextItem) {
      return;
    }

    event.preventDefault();
    focusListSelectionItem(container, nextItem);
  };

  const handleFocusin = (event: Event) => {
    if (
      !enabled.value ||
      !(event instanceof FocusEvent) ||
      !(event.target instanceof HTMLElement)
    ) {
      return;
    }

    const item = event.target.closest<HTMLElement>('[data-md-list-selection-item="true"]');

    if (item) {
      const container = getContainer();
      focusListSelectionItem(container ?? item.parentElement ?? item, item);
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
      syncListSelectionItemTabStops(container);
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
