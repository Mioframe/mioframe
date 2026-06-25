import { onMounted, onUnmounted, onUpdated, type Ref } from 'vue';
import type { MDListActionRegistry } from './listContext';
import {
  getActionRowCounterpart,
  getNextEnabledActionTarget,
  resolveOwnActionItemTarget,
} from './listActionItemNavigation';

/**
 * Wires Material List keyboard navigation for non-selection `MDList` containers holding
 * `single-action` / `multi-action` rows: `ArrowDown`/`ArrowUp` move vertically within the
 * same action column, `ArrowLeft`/`ArrowRight` move between a row's primary and trailing
 * action, and `Home`/`End` move to the first/last enabled row in the current column.
 * `Space`/`Enter` activation is handled by the focused native button/link itself.
 * @param containerRef - Live container element ref; the listener follows the element when
 * `MDList` swaps its root tag (e.g. `selectionMode`/`tag` changes), null when unmounted.
 * @param enabled - Whether to attach keyboard navigation (false = selection mode is active).
 * @param actionRegistry - Vue-owned row registry for the current MDList instance.
 */
export const useListActionKeyboard = (
  containerRef: Readonly<Ref<HTMLElement | null>>,
  enabled: Ref<boolean>,
  actionRegistry: MDListActionRegistry,
) => {
  const handleKeydown = (event: Event) => {
    if (
      !enabled.value ||
      event.defaultPrevented ||
      !(event instanceof KeyboardEvent) ||
      !(event.target instanceof HTMLElement)
    ) {
      return;
    }

    const ownTarget = resolveOwnActionItemTarget(actionRegistry, event.target);

    if (!ownTarget) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      // This row belongs to this list's own registry, so this list owns the horizontal
      // key regardless of whether a counterpart exists — stop it from also reaching an
      // ancestor action list whose own item DOM subtree happens to contain this one.
      const counterpart = getActionRowCounterpart(actionRegistry, event.target);

      if (counterpart) {
        event.preventDefault();
        counterpart.focus();
      }

      event.stopPropagation();
      return;
    }

    let direction: 'first' | 'last' | 1 | -1 | null = null;

    switch (event.key) {
      case 'ArrowDown':
        direction = 1;
        break;
      case 'ArrowUp':
        direction = -1;
        break;
      case 'Home':
        direction = 'first';
        break;
      case 'End':
        direction = 'last';
        break;
      default:
        return;
    }

    const nextTarget = getNextEnabledActionTarget(
      actionRegistry,
      event.target,
      ownTarget.column,
      direction,
    );

    if (!nextTarget) {
      return;
    }

    event.preventDefault();
    nextTarget.focus();
    event.stopPropagation();
  };

  let attachedContainer: HTMLElement | null = null;

  const syncContainer = () => {
    const nextContainer = containerRef.value;

    if (nextContainer === attachedContainer) {
      return;
    }

    attachedContainer?.removeEventListener('keydown', handleKeydown);
    nextContainer?.addEventListener('keydown', handleKeydown);
    attachedContainer = nextContainer;
  };

  onMounted(syncContainer);
  onUpdated(syncContainer);

  onUnmounted(() => {
    attachedContainer?.removeEventListener('keydown', handleKeydown);
  });
};
