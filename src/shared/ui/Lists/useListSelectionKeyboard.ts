import { nextTick, onMounted, onUnmounted, onUpdated, type Ref } from 'vue';
import type { MDListSelectionRegistry } from './listContext';
import {
  focusListSelectionItem,
  getNextEnabledListSelectionItem,
  resolveOwnSelectionItemTarget,
  syncListSelectionItemTabStops,
} from './listSelectionItemNavigation';

/**
 * Wires roving keyboard navigation and tab-stop synchronization for a listbox
 * container. Only active when `enabled` is true (i.e. when selectionMode !== 'none').
 * @param containerRef - Live container element ref; the listener follows the element when
 * `MDList` swaps its root tag (e.g. `selectionMode`/`tag` changes), null when unmounted.
 * @param enabled - Whether to attach keyboard navigation (false = selection mode is none).
 * @param selectionRegistry - Vue-owned option registry for the current MDList instance.
 */
export const useListSelectionKeyboard = (
  containerRef: Readonly<Ref<HTMLElement | null>>,
  enabled: Ref<boolean>,
  selectionRegistry: MDListSelectionRegistry,
) => {
  const moveFocus = (event: KeyboardEvent, direction: 'first' | 'last' | 1 | -1) => {
    if (!enabled.value) {
      return;
    }

    const container = containerRef.value;
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

    const item = resolveOwnSelectionItemTarget(selectionRegistry, event.target);

    if (item) {
      focusListSelectionItem(selectionRegistry, item);
    }
  };

  const handleKeydown = (event: Event) => {
    if (
      !enabled.value ||
      event.defaultPrevented ||
      !(event instanceof KeyboardEvent) ||
      !(event.target instanceof HTMLElement)
    ) {
      return;
    }

    // A nested MDList renders inside the DOM subtree of this list's own registered
    // items, so a keydown originating in a nested selection list bubbles up here too.
    // Only handle it when the event target belongs to *this* list's own registry, not
    // merely inside an item's DOM subtree that happens to contain a nested listbox.
    if (!resolveOwnSelectionItemTarget(selectionRegistry, event.target)) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        moveFocus(event, 1);
        break;
      case 'ArrowUp':
        moveFocus(event, -1);
        break;
      case 'Home':
        moveFocus(event, 'first');
        break;
      case 'End':
        moveFocus(event, 'last');
        break;
      default:
        return;
    }

    // The roving-focus key was handled by this list. Stop it from also reaching an
    // ancestor selection list's keydown listener.
    event.stopPropagation();
  };

  const syncTabStops = () => {
    if (!enabled.value || !containerRef.value) {
      return;
    }

    syncListSelectionItemTabStops(selectionRegistry);
  };

  let attachedContainer: HTMLElement | null = null;

  const syncContainer = () => {
    const nextContainer = containerRef.value;

    if (nextContainer === attachedContainer) {
      return;
    }

    attachedContainer?.removeEventListener('focusin', handleFocusin);
    attachedContainer?.removeEventListener('keydown', handleKeydown);
    nextContainer?.addEventListener('focusin', handleFocusin);
    nextContainer?.addEventListener('keydown', handleKeydown);
    attachedContainer = nextContainer;

    if (nextContainer) {
      void nextTick(syncTabStops);
    }
  };

  onMounted(syncContainer);

  onUnmounted(() => {
    attachedContainer?.removeEventListener('focusin', handleFocusin);
    attachedContainer?.removeEventListener('keydown', handleKeydown);
  });

  onUpdated(() => {
    syncContainer();
    void nextTick(syncTabStops);
  });
};
