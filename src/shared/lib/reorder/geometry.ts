/**
 * Pure geometry helpers for the physical reorder displacement algorithm.
 *
 * Nothing here touches the DOM; every function takes plain rectangles and
 * points so the displacement rule can be unit tested without a browser.
 */

/** An axis-aligned rectangle expressed in the same units as `DOMRect`. */
export interface Rect {
  /** Distance from the left edge of the measurement origin. */
  left: number;
  /** Distance from the top edge of the measurement origin. */
  top: number;
  /** Rectangle width. */
  width: number;
  /** Rectangle height. */
  height: number;
}

/** A single 2D point. */
export interface Point {
  /** Horizontal coordinate. */
  x: number;
  /** Vertical coordinate. */
  y: number;
}

/**
 * @param rect - The rectangle to find the center of.
 * @returns The rectangle's center point.
 */
const getRectCenter = (rect: Rect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

/**
 * Derives the virtual active rectangle from the current pointer position and
 * the offset originally grabbed within the active item, preserving the
 * item's width/height captured at activation.
 * @param pointer - The current pointer position.
 * @param grabOffset - The pointer offset within the active item recorded at activation.
 * @param size - The active item's width/height captured at activation.
 * @returns The virtual active rectangle for the current pointer position.
 */
export const getVirtualActiveRect = (
  pointer: Point,
  grabOffset: Point,
  size: { width: number; height: number },
): Rect => ({
  left: pointer.x - grabOffset.x,
  top: pointer.y - grabOffset.y,
  width: size.width,
  height: size.height,
});

/**
 * @param vector - The vector to normalize.
 * @returns A unit-length vector, or `null` when the input vector has zero length.
 */
export const normalizeVector = (vector: Point): Point | null => {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) return null;

  return { x: vector.x / length, y: vector.y / length };
};

/**
 * @param rect - The rectangle to project.
 * @param vector - The (ideally unit-length) direction vector to project onto.
 * @returns The scalar interval covered by `rect`'s corners along `vector`.
 */
export const projectRectOntoVector = (rect: Rect, vector: Point): { min: number; max: number } => {
  const corners: Point[] = [
    { x: rect.left, y: rect.top },
    { x: rect.left + rect.width, y: rect.top },
    { x: rect.left, y: rect.top + rect.height },
    { x: rect.left + rect.width, y: rect.top + rect.height },
  ];
  const projections = corners.map((corner) => corner.x * vector.x + corner.y * vector.y);

  return { min: Math.min(...projections), max: Math.max(...projections) };
};

/**
 * @param a - The first scalar interval.
 * @param b - The second scalar interval.
 * @returns The length of the overlap between the two intervals, or `0` when disjoint.
 */
const getIntervalOverlap = (
  a: { min: number; max: number },
  b: { min: number; max: number },
): number => Math.max(0, Math.min(a.max, b.max) - Math.max(a.min, b.min));

/**
 * Decides whether the virtual active rectangle has displaced `targetRect` far
 * enough along the active-flow-slot-to-target direction to trigger a reorder.
 *
 * The direction vector is derived from `activeFlowRect`'s center (the active
 * item's current flow position) toward `targetRect`'s center, not from raw
 * pointer movement, so the rule stays direction-independent and works for
 * unequal item sizes. Reorder triggers once the projected overlap reaches at
 * least half of the smaller of the two projected extents.
 * @param virtualActiveRect - The pointer-driven virtual rectangle of the active item.
 * @param activeFlowRect - The active item's current rectangle in normal document flow.
 * @param targetRect - The candidate target item's rectangle.
 * @returns Whether the target should be displaced now.
 */
export const shouldDisplaceTarget = (
  virtualActiveRect: Rect,
  activeFlowRect: Rect,
  targetRect: Rect,
): boolean => {
  const activeFlowCenter = getRectCenter(activeFlowRect);
  const targetCenter = getRectCenter(targetRect);

  let vector = normalizeVector({
    x: targetCenter.x - activeFlowCenter.x,
    y: targetCenter.y - activeFlowCenter.y,
  });

  if (!vector) {
    // The flow slot and target share a center (e.g. same-position swap probe).
    // Fall back to the pointer-driven virtual rect center so a direction stays defined.
    const virtualCenter = getRectCenter(virtualActiveRect);

    vector = normalizeVector({
      x: targetCenter.x - virtualCenter.x,
      y: targetCenter.y - virtualCenter.y,
    });
  }

  if (!vector) return false;

  const activeProjection = projectRectOntoVector(virtualActiveRect, vector);
  const targetProjection = projectRectOntoVector(targetRect, vector);
  const overlap = getIntervalOverlap(activeProjection, targetProjection);

  const activeExtent = activeProjection.max - activeProjection.min;
  const targetExtent = targetProjection.max - targetProjection.min;
  const smallerExtent = Math.min(activeExtent, targetExtent);

  if (smallerExtent <= 0) return false;

  return overlap >= smallerExtent / 2;
};

/**
 * @param point - The point to clamp.
 * @param rect - The rectangle to clamp the point into.
 * @returns `point`, moved to the closest position still inside `rect`.
 */
export const clampPointToRect = (point: Point, rect: Rect): Point => ({
  x: Math.min(Math.max(point.x, rect.left), rect.left + rect.width),
  y: Math.min(Math.max(point.y, rect.top), rect.top + rect.height),
});

/**
 * @param a - The first point.
 * @param b - The second point.
 * @returns The squared distance between `a` and `b`; cheaper than `Math.hypot` for comparisons.
 */
export const getSquaredDistance = (a: Point, b: Point): number =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
