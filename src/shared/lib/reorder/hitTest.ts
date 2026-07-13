/**
 * Geometric target selection during an active drag: resolves the registered
 * item under the pointer via browser hit testing instead of scanning every
 * registered rectangle every frame.
 */
import type { Point, Rect } from './geometry';
import { findRegisteredAncestor, type RegisteredTarget, type ReorderRegistry } from './registry';
import type { ReorderKey } from './types';

/**
 * A sub-pixel inset kept off the right/bottom edge of the clamped point so it never lands exactly
 * on an exclusive boundary coordinate: `document.elementsFromPoint` is defined over `[left, right)`
 * / `[top, bottom)`, so a point exactly at `right`/`bottom` can miss the element it is visually
 * inside.
 */
const HIT_TEST_EDGE_INSET_PX = 0.01;

/**
 * @param visibleContainerRect - The container's actually-visible clipped rect (client viewport,
 * not border box).
 * @param point - The raw pointer position.
 * @returns `point` clamped to the interior of `visibleContainerRect` — inclusive on the left/top
 * edge, strictly inside the right/bottom edge — so a pointer outside a visible edge still resolves
 * an intuitive hit-test target instead of stalling the drag, and `elementsFromPoint` never receives
 * an exact exclusive boundary coordinate. Returns `null` for a zero-width or zero-height visible
 * rect: there is no point inside a non-existent visible area, so callers must skip hit-testing
 * entirely rather than fabricate one.
 */
export const getEffectiveHitTestPoint = (
  visibleContainerRect: Rect,
  point: Point,
): Point | null => {
  if (visibleContainerRect.width <= 0 || visibleContainerRect.height <= 0) return null;

  const maxX = Math.max(
    visibleContainerRect.left,
    visibleContainerRect.left + visibleContainerRect.width - HIT_TEST_EDGE_INSET_PX,
  );
  const maxY = Math.max(
    visibleContainerRect.top,
    visibleContainerRect.top + visibleContainerRect.height - HIT_TEST_EDGE_INSET_PX,
  );

  return {
    x: Math.min(Math.max(point.x, visibleContainerRect.left), maxX),
    y: Math.min(Math.max(point.y, visibleContainerRect.top), maxY),
  };
};

/**
 * Resolves the registered item under `point` using `document.elementsFromPoint`, restricted to
 * `containerEl` and excluding `activeKey`. Returns `null` when nothing eligible is under the
 * point.
 * @param registry - The instance registry to search.
 * @param containerEl - The reorder container element bounding the search.
 * @param point - The effective (already edge-clamped) hit-test point.
 * @param activeKey - The key of the item currently being dragged, excluded from candidates.
 * @returns The resolved registered target, or `null` when nothing eligible is under the point.
 */
export const resolveHitTestTarget = <Key extends ReorderKey>(
  registry: ReorderRegistry<Key>,
  containerEl: Element,
  point: Point,
  activeKey: Key,
): RegisteredTarget<Key> | null => {
  const candidates = document.elementsFromPoint(point.x, point.y);

  for (const candidate of candidates) {
    if (!containerEl.contains(candidate)) continue;

    const target = findRegisteredAncestor(registry, containerEl, candidate);

    if (target && target.key !== activeKey) return target;
  }

  return null;
};
