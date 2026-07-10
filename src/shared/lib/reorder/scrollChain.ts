/**
 * Native-scroll-ownership autoscroll: builds the ordered chain of existing
 * scrollable ancestors and computes per-axis edge-zone scroll intensity and
 * speed. Never makes an element scrollable by changing its styles.
 */
import type { Point, Rect } from './geometry';
import { AUTOSCROLL_EDGE_ZONE_PX, AUTOSCROLL_MAX_SPEED_PX_PER_SEC } from './constants';

/** A scroll axis. */
export type ScrollAxis = 'x' | 'y';

/** A scroll direction along an axis: `-1` toward the start, `1` toward the end. */
export type ScrollDirection = -1 | 1;

/** The outcome of attempting to autoscroll a single axis for one tick. */
export interface AutoscrollAxisResult {
  /** Whether a scroll ancestor was actually scrolled this tick. */
  scrolled: boolean;
  /** The element that was scrolled, or `null` when nothing was eligible. */
  element: Element | null;
}

/** The combined per-axis outcome of one autoscroll tick. */
export interface AutoscrollTickResult {
  /** The horizontal axis outcome. */
  x: AutoscrollAxisResult;
  /** The vertical axis outcome. */
  y: AutoscrollAxisResult;
}

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);

/**
 * @param pointerCoord - The pointer coordinate along the axis being checked.
 * @param visibleStart - The start edge of the target's visible clipped rect along the axis.
 * @param visibleEnd - The end edge of the target's visible clipped rect along the axis.
 * @param edgeZonePx - The distance from an edge where autoscroll begins.
 * @returns A signed intensity in `[-1, 1]`; negative moves toward the start edge, positive
 * toward the end edge, `0` outside both edge zones. A pointer beyond the visible edge clamps
 * to maximum intensity so movement past the edge keeps autoscrolling.
 */
export const computeEdgeIntensity = (
  pointerCoord: number,
  visibleStart: number,
  visibleEnd: number,
  edgeZonePx: number = AUTOSCROLL_EDGE_ZONE_PX,
): number => {
  if (visibleEnd <= visibleStart || edgeZonePx <= 0) return 0;

  const distanceFromStart = Math.max(0, pointerCoord - visibleStart);
  const distanceFromEnd = Math.max(0, visibleEnd - pointerCoord);

  const startIntensity =
    distanceFromStart >= edgeZonePx ? 0 : -(1 - distanceFromStart / edgeZonePx);
  const endIntensity = distanceFromEnd >= edgeZonePx ? 0 : 1 - distanceFromEnd / edgeZonePx;

  return Math.abs(startIntensity) >= Math.abs(endIntensity) ? startIntensity : endIntensity;
};

/**
 * @param intensity - The signed edge intensity from {@link computeEdgeIntensity}.
 * @param deltaTimeMs - Elapsed time, in milliseconds, since the previous tick.
 * @param maxSpeedPxPerSec - The scroll speed reached at maximum intensity.
 * @returns The signed scroll delta, in CSS px, to apply this tick.
 */
export const computeScrollDelta = (
  intensity: number,
  deltaTimeMs: number,
  maxSpeedPxPerSec: number = AUTOSCROLL_MAX_SPEED_PX_PER_SEC,
): number => intensity * maxSpeedPxPerSec * (deltaTimeMs / 1000);

/**
 * @param element - The candidate scroll element.
 * @param axis - The axis to check.
 * @param direction - The direction the pointer wants to scroll toward.
 * @returns Whether `element`'s computed overflow permits scrolling on `axis`, its content is
 * actually larger than its client area, and it can still scroll further in `direction`.
 */
export const canScrollElementOnAxis = (
  element: Element,
  axis: ScrollAxis,
  direction: ScrollDirection,
): boolean => {
  const style = getComputedStyle(element);
  const overflowValue = axis === 'x' ? style.overflowX : style.overflowY;

  if (!SCROLLABLE_OVERFLOW_VALUES.has(overflowValue)) return false;

  const scrollExtent = axis === 'x' ? element.scrollWidth : element.scrollHeight;
  const clientExtent = axis === 'x' ? element.clientWidth : element.clientHeight;

  if (scrollExtent <= clientExtent) return false;

  const scrollPos = axis === 'x' ? element.scrollLeft : element.scrollTop;
  const maxScrollPos = scrollExtent - clientExtent;
  const roundingEpsilonPx = 1;

  return direction < 0
    ? scrollPos > roundingEpsilonPx
    : scrollPos < maxScrollPos - roundingEpsilonPx;
};

/**
 * Builds the ordered scroll-ownership chain starting from `startEl` (included first so an
 * already-scrollable container is checked before its ancestors), walking scrollable ancestors
 * nearest-first, and ending with the document scrolling element as the final fallback target.
 * @param startEl - The element to start the chain from, typically the reorder container.
 * @returns The ordered candidate chain; eligibility per axis is resolved separately.
 */
export const buildScrollChain = (startEl: Element): Element[] => {
  const chain: Element[] = [];
  let current: Element | null = startEl;

  while (current && current !== document.documentElement) {
    chain.push(current);
    current = current.parentElement;
  }

  const scrollingElement = document.scrollingElement ?? document.documentElement;

  if (!chain.includes(scrollingElement)) {
    chain.push(scrollingElement);
  }

  return chain;
};

const toRect = (domRect: DOMRect): Rect => ({
  left: domRect.left,
  top: domRect.top,
  width: domRect.width,
  height: domRect.height,
});

const intersectRects = (a: Rect, b: Rect): Rect => {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
};

/**
 * @param element - The element whose actually-visible area is requested.
 * @param clippingAncestors - Elements that clip `element`'s visible area, nearest-parent-first.
 * @returns `element`'s bounding rect intersected with every clipping ancestor and the viewport.
 */
export const getVisibleClientRect = (element: Element, clippingAncestors: Element[]): Rect => {
  let rect = toRect(element.getBoundingClientRect());

  for (const ancestor of clippingAncestors) {
    if (ancestor === element) continue;
    rect = intersectRects(rect, toRect(ancestor.getBoundingClientRect()));
  }

  const viewportRect: Rect = {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  return intersectRects(rect, viewportRect);
};

const tickAxis = (
  chain: Element[],
  axis: ScrollAxis,
  pointerCoord: number,
  deltaTimeMs: number,
  edgeZonePx: number,
  maxSpeedPxPerSec: number,
): AutoscrollAxisResult => {
  for (let index = 0; index < chain.length; index += 1) {
    const element = chain[index];
    if (!element) continue;

    const clippingAncestors = chain.slice(index + 1);
    const visibleRect = getVisibleClientRect(element, clippingAncestors);
    const start = axis === 'x' ? visibleRect.left : visibleRect.top;
    const end =
      axis === 'x' ? visibleRect.left + visibleRect.width : visibleRect.top + visibleRect.height;

    const intensity = computeEdgeIntensity(pointerCoord, start, end, edgeZonePx);

    if (intensity === 0) continue;

    const direction: ScrollDirection = intensity < 0 ? -1 : 1;

    if (!canScrollElementOnAxis(element, axis, direction)) continue;

    const delta = computeScrollDelta(intensity, deltaTimeMs, maxSpeedPxPerSec);

    if (axis === 'x') {
      element.scrollBy({ left: delta });
    } else {
      element.scrollBy({ top: delta });
    }

    return { scrolled: true, element };
  }

  return { scrolled: false, element: null };
};

/**
 * Runs one autoscroll tick: for each axis independently, walks `chain` nearest-first and scrolls
 * the first eligible target still able to scroll toward the pointer's edge, falling back to the
 * next chain entry once the nearest one reaches its limit.
 * @param chain - The scroll-ownership chain from {@link buildScrollChain}.
 * @param pointer - The current pointer position in viewport coordinates.
 * @param deltaTimeMs - Elapsed time, in milliseconds, since the previous tick.
 * @param edgeZonePx - The distance from a visible edge where autoscroll begins.
 * @param maxSpeedPxPerSec - The scroll speed reached at maximum intensity.
 * @returns The per-axis outcome of this tick.
 */
export const runAutoscrollTick = (
  chain: Element[],
  pointer: Point,
  deltaTimeMs: number,
  edgeZonePx: number = AUTOSCROLL_EDGE_ZONE_PX,
  maxSpeedPxPerSec: number = AUTOSCROLL_MAX_SPEED_PX_PER_SEC,
): AutoscrollTickResult => ({
  x: tickAxis(chain, 'x', pointer.x, deltaTimeMs, edgeZonePx, maxSpeedPxPerSec),
  y: tickAxis(chain, 'y', pointer.y, deltaTimeMs, edgeZonePx, maxSpeedPxPerSec),
});
