/**
 * Geometric target selection during an active drag: resolves the registered
 * item under the pointer via browser hit testing instead of scanning every
 * registered rectangle every frame.
 */
import { clampPointToRect, type Point, type Rect } from './geometry';
import { findRegisteredAncestor, type RegisteredTarget, type ReorderRegistry } from './registry';
import type { ReorderKey } from './types';

/**
 * @param visibleContainerRect - The container's actually-visible clipped rect.
 * @param point - The raw pointer position.
 * @returns `point` clamped to the container's visible rect, so a pointer outside a visible edge
 * still resolves an intuitive hit-test target instead of stalling the drag.
 */
export const getEffectiveHitTestPoint = (visibleContainerRect: Rect, point: Point): Point =>
  clampPointToRect(point, visibleContainerRect);

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
