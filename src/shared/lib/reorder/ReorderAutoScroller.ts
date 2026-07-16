import { Plugin } from '@dnd-kit/abstract';
import type { DragDropManager } from '@dnd-kit/dom';
import {
  canScroll,
  detectScrollIntent,
  getBoundingRectangle,
  getFrameTransform,
  getViewportBoundingRectangle,
  getVisibleBoundingRectangle,
  ScrollDirection,
} from '@dnd-kit/dom/utilities';
import { getReorderContainer } from './getReorderContainer';
import { getReorderScrollCandidates } from './getReorderScrollCandidates';
import { acquireReorderAutoscrollEnvironment } from './reorderAutoscrollEnvironment';
import type { ReorderScrollCandidateRole } from './reorderAutoscrollGeometry';
import {
  isReorderContainerEdgeHidden,
  projectVisibleScrollIntentInput,
  resolveReorderScrollDelta,
} from './reorderAutoscrollGeometry';

/**
 * Base scroll speed multiplier, matching dnd-kit 0.5.0's `AutoScroller` default
 * (`AutoScrollerOptions.acceleration`).
 */
const AUTOSCROLL_ACCELERATION = 25;

/**
 * Percentage of a candidate's dimensions that defines its scroll activation zone, matching
 * dnd-kit 0.5.0's `AutoScroller` default (`AutoScrollerOptions.threshold`).
 */
const AUTOSCROLL_THRESHOLD: Readonly<Record<'x' | 'y', number>> = { x: 0.2, y: 0.2 };

const isIdle = (direction: Readonly<Record<'x' | 'y', ScrollDirection>>): boolean =>
  direction.x === ScrollDirection.Idle && direction.y === ScrollDirection.Idle;

const transformRectangle = (
  rectangle: ReturnType<typeof getBoundingRectangle>,
  transform: ReturnType<typeof getFrameTransform>,
): ReturnType<typeof getBoundingRectangle> => ({
  top: rectangle.top * transform.scaleY + transform.y,
  right: rectangle.right * transform.scaleX + transform.x,
  bottom: rectangle.bottom * transform.scaleY + transform.y,
  left: rectangle.left * transform.scaleX + transform.x,
  width: rectangle.width * transform.scaleX,
  height: rectangle.height * transform.scaleY,
});

const getScrollIntentRectangles = (candidate: Element) => {
  const isDocumentViewport = candidate === candidate.ownerDocument.scrollingElement;
  const full = isDocumentViewport
    ? getViewportBoundingRectangle(candidate)
    : getBoundingRectangle(candidate);

  return {
    full,
    visible: isDocumentViewport ? full : getVisibleBoundingRectangle(candidate),
  };
};

/**
 * The narrow slice of `DragDropManager['dragOperation']` that the per-frame algorithm reads.
 * Kept separate from the full `DragOperation` class type so the algorithm can be exercised with
 * a lightweight fake in focused tests.
 */
export interface ReorderAutoscrollOperationSnapshot {
  /** The active drag operation's current pointer position. */
  readonly position: { readonly current: { readonly x: number; readonly y: number } };
  /** The active drag operation's source draggable, or `null` when no drag is active. */
  readonly source: { readonly element?: Element | undefined } | null;
}

/**
 * Zeroes out an axis that is either already resolved by a nearer candidate this frame, or that
 * `candidate` cannot actually scroll toward in the detected direction.
 * @param candidate - The scroll candidate being evaluated this frame.
 * @param direction - The raw direction detected for `candidate` this frame.
 * @param unresolvedX - Whether the X axis is still unresolved by a nearer candidate.
 * @param unresolvedY - Whether the Y axis is still unresolved by a nearer candidate.
 * @returns The direction `candidate` should actually be scrolled in this frame.
 */
const resolveScrollableDirection = (
  candidate: Element,
  direction: Readonly<Record<'x' | 'y', ScrollDirection>>,
  unresolvedX: boolean,
  unresolvedY: boolean,
): Record<'x' | 'y', ScrollDirection> => {
  const requested = {
    x: unresolvedX ? direction.x : ScrollDirection.Idle,
    y: unresolvedY ? direction.y : ScrollDirection.Idle,
  };

  if (isIdle(requested)) {
    return requested;
  }

  const scrollable = canScroll(candidate, requested);

  if (requested.y === ScrollDirection.Reverse && !scrollable.top) {
    requested.y = ScrollDirection.Idle;
  } else if (requested.y === ScrollDirection.Forward && !scrollable.bottom) {
    requested.y = ScrollDirection.Idle;
  }

  if (requested.x === ScrollDirection.Reverse && !scrollable.left) {
    requested.x = ScrollDirection.Idle;
  } else if (requested.x === ScrollDirection.Forward && !scrollable.right) {
    requested.x = ScrollDirection.Idle;
  }

  return requested;
};

const canRevealContainerEdge = (
  candidate: Element,
  containerRect: ReturnType<typeof getBoundingRectangle>,
  axis: 'x' | 'y',
  direction: ScrollDirection,
): boolean => {
  if (
    !isReorderContainerEdgeHidden(
      containerRect,
      getScrollIntentRectangles(candidate).visible,
      axis,
      direction,
    )
  ) {
    return false;
  }

  const requested = {
    x: axis === 'x' ? direction : ScrollDirection.Idle,
    y: axis === 'y' ? direction : ScrollDirection.Idle,
  };
  const scrollable = canScroll(candidate, requested);
  return axis === 'x'
    ? direction === ScrollDirection.Reverse
      ? scrollable.left
      : scrollable.right
    : direction === ScrollDirection.Reverse
      ? scrollable.top
      : scrollable.bottom;
};

/**
 * Resolves and applies one candidate's scroll delta for the current frame, returning which axes
 * it owns after visibility and scrollability are considered.
 * @param candidate - The scroll candidate being evaluated this frame.
 * @param container - The active reorder container.
 * @param containerRect - The reorder container's bounding rectangle this frame.
 * @param pointerPosition - The current pointer position.
 * @param unresolvedX - Whether the X axis is still unresolved by a nearer candidate.
 * @param unresolvedY - Whether the Y axis is still unresolved by a nearer candidate.
 * @param ancestors - Candidates farther outward than `candidate`, used to defer inner scrolling
 * while one of them can reveal the requested physical container edge.
 * @returns Which axes `candidate` resolved this frame.
 */
const applyReorderScrollCandidate = (
  candidate: Element,
  container: Element,
  containerRect: ReturnType<typeof getBoundingRectangle>,
  pointerPosition: { x: number; y: number },
  unresolvedX: boolean,
  unresolvedY: boolean,
  ancestors: readonly Element[],
): { resolvedX: boolean; resolvedY: boolean } => {
  const { full: candidateRect, visible: visibleCandidateRect } =
    getScrollIntentRectangles(candidate);
  const frameTransform = getFrameTransform(candidate);
  const intentInput = projectVisibleScrollIntentInput(
    transformRectangle(candidateRect, frameTransform),
    transformRectangle(visibleCandidateRect, frameTransform),
    pointerPosition,
  );
  if (!intentInput) {
    return { resolvedX: false, resolvedY: false };
  }

  const { direction, speed } = detectScrollIntent(
    candidate,
    intentInput.coordinates,
    undefined,
    AUTOSCROLL_ACCELERATION,
    AUTOSCROLL_THRESHOLD,
    intentInput.tolerance,
  );
  const boundedSpeed = {
    x: Math.min(speed.x, AUTOSCROLL_ACCELERATION),
    y: Math.min(speed.y, AUTOSCROLL_ACCELERATION),
  };

  const effectiveDirection = resolveScrollableDirection(
    candidate,
    direction,
    unresolvedX,
    unresolvedY,
  );

  if (candidate === container) {
    if (
      effectiveDirection.x !== ScrollDirection.Idle &&
      ancestors.some((ancestor) =>
        canRevealContainerEdge(ancestor, containerRect, 'x', effectiveDirection.x),
      )
    ) {
      effectiveDirection.x = ScrollDirection.Idle;
    }
    if (
      effectiveDirection.y !== ScrollDirection.Idle &&
      ancestors.some((ancestor) =>
        canRevealContainerEdge(ancestor, containerRect, 'y', effectiveDirection.y),
      )
    ) {
      effectiveDirection.y = ScrollDirection.Idle;
    }
  }

  if (isIdle(effectiveDirection)) {
    return { resolvedX: false, resolvedY: false };
  }

  const role: ReorderScrollCandidateRole = candidate === container ? 'container' : 'ancestor';
  const clampRectangle = role === 'ancestor' ? visibleCandidateRect : containerRect;

  const delta = resolveReorderScrollDelta(role, containerRect, clampRectangle, {
    direction: effectiveDirection,
    speed: boundedSpeed,
  });

  const previousLeft = candidate.scrollLeft;
  const previousTop = candidate.scrollTop;

  if (delta.x !== 0 || delta.y !== 0) {
    candidate.scrollTo({
      left: previousLeft + delta.x,
      top: previousTop + delta.y,
      behavior: 'instant',
    });
  }

  return {
    // An ancestor with a non-zero visibility delta owns that axis even if the DOM reports no
    // movement after scrollTo. Failure to move is not permission to hand the same axis farther
    // outward; geometry must become clipped there again before another ancestor is eligible.
    resolvedX: role === 'ancestor' ? delta.x !== 0 : candidate.scrollLeft !== previousLeft,
    resolvedY: role === 'ancestor' ? delta.y !== 0 : candidate.scrollTop !== previousTop,
  };
};

/**
 * Runs one animation frame of the scoped autoscroll algorithm: a single linear pass over the
 * precomputed candidate chain, resolving X and Y together and stopping as soon as both axes are
 * resolved or no candidates remain. See `resolveReorderScrollDelta` for the per-candidate
 * visibility policy. Exported for focused testing of the per-frame algorithm; not part of the
 * package's public barrel.
 * @param manager - The drag and drop manager that owns the active drag operation.
 * @param container - The active reorder container, as resolved by `getReorderContainer`.
 * @param candidates - The precomputed scroll candidate chain, nearest to farthest.
 */
export const runReorderAutoscrollFrame = (
  manager: { dragOperation: ReorderAutoscrollOperationSnapshot },
  container: Element,
  candidates: readonly Element[],
): void => {
  const { position, source } = manager.dragOperation;
  if (!container.isConnected || !source?.element?.isConnected) {
    return;
  }

  const pointerPosition = position.current;
  const containerRect = getBoundingRectangle(container);

  let unresolvedX = true;
  let unresolvedY = true;

  for (const [candidateIndex, candidate] of candidates.entries()) {
    if (!unresolvedX && !unresolvedY) {
      break;
    }

    const { resolvedX, resolvedY } = applyReorderScrollCandidate(
      candidate,
      container,
      containerRect,
      pointerPosition,
      unresolvedX,
      unresolvedY,
      candidates.slice(candidateIndex + 1),
    );

    if (unresolvedX && resolvedX) {
      unresolvedX = false;
    }
    if (unresolvedY && resolvedY) {
      unresolvedY = false;
    }
  }
};

/**
 * Autoscroll plugin scoped to the active reorder container. Replaces dnd-kit's default
 * `AutoScroller` in `getReorderPlugins`: it owns the complete reorder-specific autoscroll
 * operation instead of delegating to the standard `Scroller`, so it can resolve X and Y together
 * in one candidate pass per frame. A scroll-capable ancestor that hides the relevant physical
 * container edge owns that axis until its clamp reveals the edge (see
 * `resolveReorderScrollDelta`); only then may the container scroll its own content. This also
 * prevents an exhausted inner container from handing an already-visible surface back outward.
 *
 * The candidate chain (see `getReorderScrollCandidates`) is built once per drag; only pointer
 * position, drag status, and candidate geometry are re-read every animation frame.
 */
export class ReorderAutoScroller extends Plugin<DragDropManager> {
  /**
   * Creates the plugin instance and starts its per-drag autoscroll effect.
   * @param manager - The drag and drop manager that owns this plugin.
   */
  constructor(manager: DragDropManager) {
    super(manager);

    this.registerEffect(() => {
      if (this.disabled || !manager.dragOperation.status.dragging) {
        return;
      }

      const container = getReorderContainer(manager.dragOperation);
      if (!container) {
        return;
      }

      const candidates = getReorderScrollCandidates(container);
      if (candidates.length === 0) {
        return;
      }

      const environment = acquireReorderAutoscrollEnvironment(candidates);

      let active = true;
      let frameId: number | undefined;

      const tick = () => {
        if (!active || this.disabled || !manager.dragOperation.status.dragging) {
          active = false;
          return;
        }

        runReorderAutoscrollFrame(manager, container, candidates);
        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);

      return () => {
        active = false;
        if (frameId !== undefined) {
          cancelAnimationFrame(frameId);
        }
        environment.dispose();
      };
    });
  }
}
