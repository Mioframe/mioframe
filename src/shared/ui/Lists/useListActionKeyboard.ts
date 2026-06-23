import { onMounted, onUnmounted, type Ref } from 'vue';
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
 * @param getContainer - Returns the live container element, or null when unmounted.
 * @param enabled - Whether to attach keyboard navigation (false = selection mode is active).
 * @param actionRegistry - Vue-owned row registry for the current MDList instance.
 */
export const useListActionKeyboard = (
  getContainer: () => HTMLElement | null,
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
      const counterpart = getActionRowCounterpart(actionRegistry, event.target);

      if (!counterpart) {
        return;
      }

      event.preventDefault();
      counterpart.focus();
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

  onMounted(() => {
    getContainer()?.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    getContainer()?.removeEventListener('keydown', handleKeydown);
  });
};
