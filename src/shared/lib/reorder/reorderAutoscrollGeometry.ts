import { ScrollDirection } from '@dnd-kit/dom/utilities';

/** Minimal rectangle shape shared by DOM bounding rects, needed for the geometry below. */
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

/** Pointer coordinates and tolerance projected into dnd-kit's full candidate rectangle. */
export interface ProjectedScrollIntentInput {
  /** Pointer coordinates with each axis' visible relative position mapped into the full axis. */
  readonly coordinates: { readonly x: number; readonly y: number };
  /** Orthogonal tolerance scaled so it remains equivalent to visible CSS pixels. */
  readonly tolerance: { readonly x: number; readonly y: number };
}

/** dnd-kit 0.5.0's default orthogonal tolerance, expressed in visible CSS pixels. */
export const AUTOSCROLL_VISIBLE_TOLERANCE_PX = 10;

const projectAxis = (
  coordinate: number,
  fullStart: number,
  fullEnd: number,
  visibleStart: number,
  visibleEnd: number,
): { coordinate: number; scale: number } | null => {
  const fullSize = fullEnd - fullStart;
  const visibleSize = visibleEnd - visibleStart;
  if (fullSize <= 0 || visibleSize <= 0) {
    return null;
  }

  const scale = fullSize / visibleSize;
  return {
    coordinate: fullStart + (coordinate - visibleStart) * scale,
    scale,
  };
};

/**
 * Projects a real pointer from a clipped candidate rectangle into the equivalent relative
 * position in dnd-kit's full candidate rectangle. This lets dnd-kit's existing threshold,
 * acceleration, inversion, and scroll-limit algorithm operate relative to the visible area.
 * @param fullRect - Candidate rectangle in the coordinate space used by `detectScrollIntent`.
 * @param visibleRect - Actually visible candidate rectangle in the same coordinate space.
 * @param pointerPosition - Real pointer coordinates in that coordinate space.
 * @param visibleTolerance - dnd-kit's orthogonal tolerance measured in visible CSS pixels.
 * @returns Projected coordinates and tolerance, or `null` when either visible axis is empty.
 */
export const projectVisibleScrollIntentInput = (
  fullRect: AutoscrollRectangle,
  visibleRect: AutoscrollRectangle,
  pointerPosition: { readonly x: number; readonly y: number },
  visibleTolerance: number = AUTOSCROLL_VISIBLE_TOLERANCE_PX,
): ProjectedScrollIntentInput | null => {
  const x = projectAxis(
    pointerPosition.x,
    fullRect.left,
    fullRect.right,
    visibleRect.left,
    visibleRect.right,
  );
  const y = projectAxis(
    pointerPosition.y,
    fullRect.top,
    fullRect.bottom,
    visibleRect.top,
    visibleRect.bottom,
  );
  if (!x || !y) {
    return null;
  }

  return {
    coordinates: { x: x.coordinate, y: y.coordinate },
    tolerance: { x: visibleTolerance * x.scale, y: visibleTolerance * y.scale },
  };
};

/** One axis' detected scroll direction and magnitude, as returned by `detectScrollIntent`. */
export interface ReorderScrollIntent {
  /** Detected scroll direction per axis. */
  readonly direction: Readonly<Record<'x' | 'y', ScrollDirection>>;
  /** Detected scroll speed per axis (unsigned magnitude). */
  readonly speed: Readonly<Record<'x' | 'y', number>>;
}

/**
 * A scroll candidate's relationship to the active reorder container: `container` is the reorder
 * container itself, `ancestor` is a scrollable DOM ancestor that contains it.
 */
export type ReorderScrollCandidateRole = 'container' | 'ancestor';

/** Default fractional-geometry tolerance, in pixels, for the hidden-distance comparisons below. */
export const AUTOSCROLL_GEOMETRY_TOLERANCE_PX = 1;

const getMeaningfulHiddenDistance = (hiddenDistance: number, tolerance: number): number =>
  Math.max(0, hiddenDistance - tolerance);

/**
 * Resolves the combined `{x, y}` scroll delta for one candidate in the active reorder
 * container's scrollable ancestor chain.
 *
 * The reorder container itself (`role: 'container'`) gets the detected direction/speed applied
 * unrestricted: its own internal overflow is what reveals hidden sortable items, so there is no
 * outer visibility to respect.
 *
 * An outer ancestor (`role: 'ancestor'`) is clamped so it only scrolls toward an edge that is
 * still hiding part of the container, and never scrolls further than the remaining hidden
 * distance on that edge, i.e. it stops the instant the container's edge becomes visible.
 * @param role - The candidate's relationship to the reorder container.
 * @param containerRect - The reorder container's own bounding rectangle.
 * @param visibleCandidateRect - The candidate's currently visible bounding rectangle (see
 * `getVisibleBoundingRectangle` from `@dnd-kit/dom/utilities`). Ignored for `role: 'container'`.
 * @param intent - The scroll direction/speed detected for this candidate this frame (see
 * `detectScrollIntent` from `@dnd-kit/dom/utilities`).
 * @param tolerance - Pixel tolerance absorbing fractional layout geometry.
 * @returns The combined scroll delta to apply to this candidate this frame.
 */
export const resolveReorderScrollDelta = (
  role: ReorderScrollCandidateRole,
  containerRect: AutoscrollRectangle,
  visibleCandidateRect: AutoscrollRectangle,
  intent: ReorderScrollIntent,
  tolerance: number = AUTOSCROLL_GEOMETRY_TOLERANCE_PX,
): { x: number; y: number } => {
  if (role === 'container') {
    return {
      x: intent.direction.x * intent.speed.x,
      y: intent.direction.y * intent.speed.y,
    };
  }

  const hiddenTop = getMeaningfulHiddenDistance(
    Math.max(0, visibleCandidateRect.top - containerRect.top),
    tolerance,
  );
  const hiddenBottom = getMeaningfulHiddenDistance(
    Math.max(0, containerRect.bottom - visibleCandidateRect.bottom),
    tolerance,
  );
  const hiddenLeft = getMeaningfulHiddenDistance(
    Math.max(0, visibleCandidateRect.left - containerRect.left),
    tolerance,
  );
  const hiddenRight = getMeaningfulHiddenDistance(
    Math.max(0, containerRect.right - visibleCandidateRect.right),
    tolerance,
  );

  let y = 0;
  if (intent.direction.y === ScrollDirection.Reverse && hiddenTop > 0) {
    y = -Math.min(intent.speed.y, hiddenTop);
  } else if (intent.direction.y === ScrollDirection.Forward && hiddenBottom > 0) {
    y = Math.min(intent.speed.y, hiddenBottom);
  }

  let x = 0;
  if (intent.direction.x === ScrollDirection.Reverse && hiddenLeft > 0) {
    x = -Math.min(intent.speed.x, hiddenLeft);
  } else if (intent.direction.x === ScrollDirection.Forward && hiddenRight > 0) {
    x = Math.min(intent.speed.x, hiddenRight);
  }

  return { x, y };
};
