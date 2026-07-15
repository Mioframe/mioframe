import { Plugin } from '@dnd-kit/abstract';
import { Scroller, type DragDropManager } from '@dnd-kit/dom';
import {
  canScroll,
  getBoundingRectangle,
  getComputedStyles,
  getScrollableAncestors,
  getVisibleBoundingRectangle,
  scheduler,
} from '@dnd-kit/dom/utilities';
import { keys } from '@shared/lib/objectKeys';
import type {
  AllowedAutoscrollDirections,
  AutoscrollRectangle,
} from './reorderAutoscrollDirections';
import { getAllowedAutoscrollDirections } from './reorderAutoscrollDirections';

type AutoscrollDirection = keyof AllowedAutoscrollDirections;

const DIRECTION_DELTAS: Record<AutoscrollDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const DIRECTION_CAN_SCROLL_KEYS: Record<AutoscrollDirection, 'top' | 'bottom' | 'left' | 'right'> =
  {
    up: 'top',
    down: 'bottom',
    left: 'left',
    right: 'right',
  };

/**
 * Autoscroll plugin scoped to the active reorder container. Used in place of dnd-kit's default
 * `AutoScroller` (see `getReorderPlugins`): the reorder container itself keeps standard,
 * unrestricted dnd-kit autoscroll, but an outer scrollable ancestor (e.g. a bottom sheet) only
 * autoscrolls in directions that would reveal more of the container. This stops a fully visible
 * container from dragging an already-fully-visible outer ancestor along with it.
 *
 * All actual scrolling is delegated to the standard dnd-kit `Scroller` plugin; this plugin only
 * decides, once per animation frame while a drag is active, which directions are worth
 * attempting.
 */
export class ReorderScopedAutoScroller extends Plugin<DragDropManager> {
  /**
   * Creates the plugin instance and starts its per-frame autoscroll effect.
   * @param manager - The drag and drop manager that owns this plugin.
   */
  constructor(manager: DragDropManager) {
    super(manager);

    const scroller = manager.registry.plugins.get(Scroller);
    if (!scroller) {
      throw new Error('ReorderScopedAutoScroller plugin depends on the Scroller plugin');
    }

    this.registerEffect(() => {
      if (this.isDisabled() || !manager.dragOperation.status.dragging) {
        return;
      }

      let active = true;
      const tick = () => {
        if (!active) {
          return;
        }
        attemptScopedAutoscroll(manager, scroller);
        void scheduler.schedule(tick);
      };
      tick();

      return () => {
        active = false;
      };
    });
  }
}

const attemptScopedAutoscroll = (manager: DragDropManager, scroller: Scroller): void => {
  const container = manager.dragOperation.source?.element?.parentElement;
  if (!container) {
    return;
  }

  const ancestors = getScrollableAncestors(container, { excludeElement: false });
  const containerRect = getBoundingRectangle(container);

  for (const direction of keys(DIRECTION_DELTAS)) {
    if (isDirectionReachable(direction, container, ancestors, containerRect)) {
      scroller.scroll({ by: DIRECTION_DELTAS[direction] });
    }
  }
};

const isDirectionReachable = (
  direction: AutoscrollDirection,
  container: Element,
  ancestors: ReadonlySet<Element>,
  containerRect: AutoscrollRectangle,
): boolean => {
  const canScrollKey = DIRECTION_CAN_SCROLL_KEYS[direction];

  for (const candidate of ancestors) {
    const role = candidate === container ? 'container' : 'ancestor';
    const visibleAncestorRect =
      role === 'container' ? containerRect : getVisibleBoundingRectangle(candidate);
    const allowed = getAllowedAutoscrollDirections(role, containerRect, visibleAncestorRect);

    if (allowed[direction] && canScroll(candidate, DIRECTION_DELTAS[direction])[canScrollKey]) {
      return true;
    }

    // `getScrollableAncestors` always appends the document's scrolling element right after a
    // `position: fixed` candidate (for visual-viewport edge cases), even though scrolling the
    // document can never move a fixed-position candidate or anything nested inside it. That
    // appended element's geometry is not a meaningful "does this reveal more of the container"
    // signal, so stop considering candidates once a fixed one has been evaluated.
    if (getComputedStyles(candidate, true).position === 'fixed') {
      break;
    }
  }

  return false;
};
