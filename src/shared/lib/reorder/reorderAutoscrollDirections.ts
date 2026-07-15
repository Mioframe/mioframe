/** Minimal rectangle shape shared by DOM bounding rects, needed for the direction policy below. */
export interface AutoscrollRectangle {
  /** Distance from the top of the coordinate space. */
  readonly top: number;
  /** Distance from the left of the coordinate space to the right edge. */
  readonly right: number;
  /** Distance from the top of the coordinate space to the bottom edge. */
  readonly bottom: number;
  /** Distance from the left of the coordinate space. */
  readonly left: number;
}

/** Which of the four scroll directions are currently allowed for one scrollable candidate. */
export interface AllowedAutoscrollDirections {
  /** Whether scrolling toward the top edge is allowed. */
  readonly up: boolean;
  /** Whether scrolling toward the bottom edge is allowed. */
  readonly down: boolean;
  /** Whether scrolling toward the left edge is allowed. */
  readonly left: boolean;
  /** Whether scrolling toward the right edge is allowed. */
  readonly right: boolean;
}

/**
 * A scrollable element's relationship to the active reorder container: `container` is the
 * reorder container itself, `ancestor` is a scrollable DOM ancestor that contains it, and
 * `unrelated` is anything else.
 */
export type AutoscrollCandidateRole = 'container' | 'ancestor' | 'unrelated';

/** Default fractional-geometry tolerance, in pixels, for the direction comparisons below. */
export const AUTOSCROLL_DIRECTION_TOLERANCE_PX = 1;

const ALL_DIRECTIONS_ALLOWED: AllowedAutoscrollDirections = {
  up: true,
  down: true,
  left: true,
  right: true,
};

const NO_DIRECTIONS_ALLOWED: AllowedAutoscrollDirections = {
  up: false,
  down: false,
  left: false,
  right: false,
};

/**
 * Decides which autoscroll directions may reveal more of the active reorder container.
 *
 * The reorder container itself always gets standard dnd-kit autoscroll (role `'container'`), and
 * a candidate outside the container's own scrollable ancestor chain never scrolls (role
 * `'unrelated'`). For a genuine outer scrollable ancestor (role `'ancestor'`), a direction is
 * allowed only when the container extends past that ancestor's currently visible rectangle on the
 * matching edge, i.e. scrolling that ancestor in that direction would reveal more of the
 * container.
 * @param role - The candidate's relationship to the reorder container.
 * @param containerRect - The reorder container's own bounding rectangle.
 * @param visibleAncestorRect - The candidate ancestor's currently visible bounding rectangle (see
 * `getVisibleBoundingRectangle` from `@dnd-kit/dom/utilities`). Ignored for `container` and
 * `unrelated` roles.
 * @param tolerance - Pixel tolerance absorbing fractional layout geometry.
 * @returns Which of up/down/left/right autoscroll is currently allowed for this candidate.
 */
export const getAllowedAutoscrollDirections = (
  role: AutoscrollCandidateRole,
  containerRect: AutoscrollRectangle,
  visibleAncestorRect: AutoscrollRectangle,
  tolerance: number = AUTOSCROLL_DIRECTION_TOLERANCE_PX,
): AllowedAutoscrollDirections => {
  if (role === 'container') {
    return ALL_DIRECTIONS_ALLOWED;
  }

  if (role === 'unrelated') {
    return NO_DIRECTIONS_ALLOWED;
  }

  return {
    up: containerRect.top < visibleAncestorRect.top - tolerance,
    down: containerRect.bottom > visibleAncestorRect.bottom + tolerance,
    left: containerRect.left < visibleAncestorRect.left - tolerance,
    right: containerRect.right > visibleAncestorRect.right + tolerance,
  };
};
