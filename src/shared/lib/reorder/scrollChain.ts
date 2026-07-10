/**
 * Native-scroll-ownership autoscroll.
 *
 * The scroll-ownership chain (which ancestors may own scrolling, and which ancestors clip
 * visibility) is structural and is decided once at drag activation via {@link buildScrollChain}.
 * Every active frame then runs a bounded read/compute/write pipeline through
 * {@link runAutoscrollTick}: one linear-in-depth measurement pass, pure per-axis intention
 * computation from that single snapshot, then the scroll writes. The viewport is always the
 * final target and is modeled explicitly through `window.scrollX/Y`, `window.scrollBy`, and
 * document scroll extents — never as an ordinary overflow element. Never makes an element
 * scrollable by changing its styles.
 */
import type { Point, Rect } from './geometry';
import { AUTOSCROLL_EDGE_ZONE_PX, AUTOSCROLL_MAX_SPEED_PX_PER_SEC } from './constants';

/** A scroll axis. */
export type ScrollAxis = 'x' | 'y';

/** A scroll direction along an axis: `-1` toward the start, `1` toward the end. */
export type ScrollDirection = -1 | 1;

const SCROLL_CANDIDATE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
const CLIPPING_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'hidden', 'clip', 'overlay']);
const ROUNDING_EPSILON_PX = 1;

/**
 * One DOM-ancestor entry in the reorder container's scroll/clipping structure, nearest-first
 * (the container itself is always the first entry). Eligibility is decided once at activation;
 * only dynamic values (rects, scroll position/extent) are re-read every frame.
 */
export interface ScrollChainEntry {
  /** The ancestor element (or the container itself for the first entry). */
  element: HTMLElement;
  /** Whether this element may own horizontal scrolling (computed `overflow-x` at activation). */
  scrollCandidateX: boolean;
  /** Whether this element may own vertical scrolling (computed `overflow-y` at activation). */
  scrollCandidateY: boolean;
  /** Whether this element clips its descendants' visible bounds on the horizontal axis. */
  clipsX: boolean;
  /** Whether this element clips its descendants' visible bounds on the vertical axis. */
  clipsY: boolean;
}

/**
 * Builds the ancestor structure once at drag activation: every ancestor from `containerEl`
 * (included first) up to (excluding) the document root, tagged with whether it may own scrolling
 * and whether it clips, per axis. The viewport is always the implicit final scroll target and is
 * not part of this structure.
 * @param containerEl - The reorder container to start the walk from.
 * @returns The ordered, tagged ancestor chain.
 */
export const buildScrollChain = (containerEl: HTMLElement): ScrollChainEntry[] => {
  const entries: ScrollChainEntry[] = [];
  let current: HTMLElement | null = containerEl;

  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current);

    entries.push({
      element: current,
      scrollCandidateX: SCROLL_CANDIDATE_OVERFLOW_VALUES.has(style.overflowX),
      scrollCandidateY: SCROLL_CANDIDATE_OVERFLOW_VALUES.has(style.overflowY),
      clipsX: CLIPPING_OVERFLOW_VALUES.has(style.overflowX),
      clipsY: CLIPPING_OVERFLOW_VALUES.has(style.overflowY),
    });

    current = current.parentElement;
  }

  return entries;
};

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
 * @returns Whether `element` still has scrollable extent left and can still scroll further in
 * `direction`. Overflow eligibility itself is decided once at activation ({@link buildScrollChain});
 * this only re-reads the dynamic scroll position and extent.
 */
export const canScrollElementOnAxis = (
  element: Element,
  axis: ScrollAxis,
  direction: ScrollDirection,
): boolean => {
  const scrollExtent = axis === 'x' ? element.scrollWidth : element.scrollHeight;
  const clientExtent = axis === 'x' ? element.clientWidth : element.clientHeight;

  if (scrollExtent <= clientExtent) return false;

  const scrollPos = axis === 'x' ? element.scrollLeft : element.scrollTop;
  const maxScrollPos = scrollExtent - clientExtent;

  return direction < 0
    ? scrollPos > ROUNDING_EPSILON_PX
    : scrollPos < maxScrollPos - ROUNDING_EPSILON_PX;
};

/**
 * @param axis - The axis to check.
 * @param direction - The direction the pointer wants to scroll toward.
 * @returns Whether the viewport still has scrollable extent left and can still scroll further in
 * `direction`, read from `window.scrollX/Y`, the viewport size, and document scroll extents.
 */
export const canScrollViewportOnAxis = (axis: ScrollAxis, direction: ScrollDirection): boolean => {
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  const scrollExtent = axis === 'x' ? scrollingElement.scrollWidth : scrollingElement.scrollHeight;
  const clientExtent = axis === 'x' ? window.innerWidth : window.innerHeight;

  if (scrollExtent <= clientExtent) return false;

  const scrollPos = axis === 'x' ? window.scrollX : window.scrollY;
  const maxScrollPos = scrollExtent - clientExtent;

  return direction < 0
    ? scrollPos > ROUNDING_EPSILON_PX
    : scrollPos < maxScrollPos - ROUNDING_EPSILON_PX;
};

const toRect = (domRect: DOMRect): Rect => ({
  left: domRect.left,
  top: domRect.top,
  width: domRect.width,
  height: domRect.height,
});

/** One linear-in-depth read pass over a {@link ScrollChainEntry} chain for a single frame. */
export interface ScrollChainMeasurement {
  /** Each entry's own bounding rect, index-aligned with the chain. */
  entryRects: Rect[];
  /**
   * Each entry's actually-visible rect (its own rect intersected with genuine clipping
   * ancestors only), index-aligned with the chain. An `overflow: visible` ancestor never
   * shrinks this.
   */
  entryVisibleRects: Rect[];
  /** The current viewport rect in viewport coordinates. */
  viewportRect: Rect;
}

/**
 * Reads every dynamic value the current frame needs from `entries` exactly once: each element's
 * own bounding rect (a single `getBoundingClientRect()` call per element, never per axis, never
 * repeated through nested ancestor loops), then folds genuine clipping ancestors into a running
 * bound in one outer-to-inner pass so each entry's visible rect is derived in constant time. This
 * keeps the whole read phase linear in ancestor depth.
 * @param entries - The activation-time scroll chain structure.
 * @returns The frame's single measurement snapshot, reused for both axes and for hit-testing.
 */
export const measureScrollChain = (
  entries: readonly ScrollChainEntry[],
): ScrollChainMeasurement => {
  const entryRects = entries.map((entry) => toRect(entry.element.getBoundingClientRect()));
  const viewportRect: Rect = {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const entryVisibleRects: Rect[] = new Array(entries.length);

  let accLeft = viewportRect.left;
  let accTop = viewportRect.top;
  let accRight = viewportRect.left + viewportRect.width;
  let accBottom = viewportRect.top + viewportRect.height;

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const rect = entryRects[index];
    if (!entry || !rect) continue;

    const ownLeft = rect.left;
    const ownTop = rect.top;
    const ownRight = rect.left + rect.width;
    const ownBottom = rect.top + rect.height;

    const visLeft = Math.max(accLeft, ownLeft);
    const visTop = Math.max(accTop, ownTop);
    const visRight = Math.min(accRight, ownRight);
    const visBottom = Math.min(accBottom, ownBottom);

    entryVisibleRects[index] = {
      left: visLeft,
      top: visTop,
      width: Math.max(0, visRight - visLeft),
      height: Math.max(0, visBottom - visTop),
    };

    // Only genuine clipping ancestors tighten the bound carried inward; `overflow: visible`
    // ancestors are never folded in, so they never shrink a descendant's visible rect.
    if (entry.clipsX) {
      accLeft = Math.max(accLeft, ownLeft);
      accRight = Math.min(accRight, ownRight);
    }
    if (entry.clipsY) {
      accTop = Math.max(accTop, ownTop);
      accBottom = Math.min(accBottom, ownBottom);
    }
  }

  return { entryRects, entryVisibleRects, viewportRect };
};

/**
 * @param entries - The activation-time scroll chain structure.
 * @param measurement - The current frame's measurement snapshot.
 * @returns The reorder container's own actually-visible rect (the chain's first entry), used to
 * clamp the hit-test point so a pointer outside a visible edge still resolves intuitively.
 */
export const getContainerVisibleRect = (
  entries: readonly ScrollChainEntry[],
  measurement: ScrollChainMeasurement,
): Rect => measurement.entryVisibleRects[0] ?? measurement.viewportRect;

/** A resolved, not-yet-applied scroll intention for one axis. */
interface AxisIntention {
  /** Index into the chain `entries`, or `-1` for the viewport (the always-present final target). */
  targetIndex: number;
  /** The signed scroll delta, in CSS px, to apply this tick. */
  delta: number;
}

const resolveAxisIntention = (
  entries: readonly ScrollChainEntry[],
  measurement: ScrollChainMeasurement,
  axis: ScrollAxis,
  pointerCoord: number,
  deltaTimeMs: number,
  edgeZonePx: number,
  maxSpeedPxPerSec: number,
): AxisIntention | null => {
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const visibleRect = measurement.entryVisibleRects[index];
    if (!entry || !visibleRect) continue;

    const isCandidate = axis === 'x' ? entry.scrollCandidateX : entry.scrollCandidateY;
    if (!isCandidate) continue;

    const start = axis === 'x' ? visibleRect.left : visibleRect.top;
    const end =
      axis === 'x' ? visibleRect.left + visibleRect.width : visibleRect.top + visibleRect.height;
    const intensity = computeEdgeIntensity(pointerCoord, start, end, edgeZonePx);
    if (intensity === 0) continue;

    const direction: ScrollDirection = intensity < 0 ? -1 : 1;
    if (!canScrollElementOnAxis(entry.element, axis, direction)) continue;

    return {
      targetIndex: index,
      delta: computeScrollDelta(intensity, deltaTimeMs, maxSpeedPxPerSec),
    };
  }

  const start = axis === 'x' ? measurement.viewportRect.left : measurement.viewportRect.top;
  const end =
    axis === 'x'
      ? measurement.viewportRect.left + measurement.viewportRect.width
      : measurement.viewportRect.top + measurement.viewportRect.height;
  const intensity = computeEdgeIntensity(pointerCoord, start, end, edgeZonePx);
  if (intensity === 0) return null;

  const direction: ScrollDirection = intensity < 0 ? -1 : 1;
  if (!canScrollViewportOnAxis(axis, direction)) return null;

  return { targetIndex: -1, delta: computeScrollDelta(intensity, deltaTimeMs, maxSpeedPxPerSec) };
};

const scrollTarget = (
  entries: readonly ScrollChainEntry[],
  targetIndex: number,
  delta: { left?: number; top?: number },
): Element => {
  if (targetIndex === -1) {
    window.scrollBy(delta);
    return document.scrollingElement ?? document.documentElement;
  }

  const element = entries[targetIndex]?.element;
  if (!element) throw new Error('useReorder: autoscroll target index out of range.');

  element.scrollBy(delta);
  return element;
};

/** The outcome of attempting to autoscroll a single axis for one tick. */
export interface AutoscrollAxisResult {
  /** Whether a scroll target was actually scrolled this tick. */
  scrolled: boolean;
  /**
   * The element that was scrolled (the viewport's scrolling element for the viewport target), or
   * `null` when nothing was eligible.
   */
  element: Element | null;
}

/** The combined per-axis outcome of one autoscroll tick. */
export interface AutoscrollTickResult {
  /** The horizontal axis outcome. */
  x: AutoscrollAxisResult;
  /** The vertical axis outcome. */
  y: AutoscrollAxisResult;
  /**
   * This tick's single read-phase measurement, reused by callers for hit-test clamping so no
   * second measurement pass is needed in the same frame.
   */
  measurement: ScrollChainMeasurement;
}

/**
 * @param result - One tick's outcome.
 * @returns Whether either axis actually wrote a scroll this tick. When `true`, callers must skip
 * reorder hit-testing and item geometry reads until the next animation frame, so a scroll write is
 * never followed by a layout read in the same frame.
 */
export const didAutoscroll = (result: AutoscrollTickResult): boolean =>
  result.x.scrolled || result.y.scrolled;

/**
 * Runs one autoscroll tick: reads chain geometry exactly once (see {@link measureScrollChain}),
 * computes each axis's scroll intention from that single snapshot without writing, then performs
 * the scroll writes — combined into one call when both axes select the same target. Nearest-first
 * per axis, falling back to the next chain entry once the nearest eligible one reaches its scroll
 * limit, and finally to the viewport.
 * @param entries - The scroll-ownership chain from {@link buildScrollChain}.
 * @param pointer - The current pointer position in viewport coordinates.
 * @param deltaTimeMs - Elapsed time, in milliseconds, since the previous tick.
 * @param edgeZonePx - The distance from a visible edge where autoscroll begins.
 * @param maxSpeedPxPerSec - The scroll speed reached at maximum intensity.
 * @returns The per-axis outcome of this tick, plus the reusable measurement snapshot.
 */
export const runAutoscrollTick = (
  entries: readonly ScrollChainEntry[],
  pointer: Point,
  deltaTimeMs: number,
  edgeZonePx: number = AUTOSCROLL_EDGE_ZONE_PX,
  maxSpeedPxPerSec: number = AUTOSCROLL_MAX_SPEED_PX_PER_SEC,
): AutoscrollTickResult => {
  const measurement = measureScrollChain(entries);

  const xIntention = resolveAxisIntention(
    entries,
    measurement,
    'x',
    pointer.x,
    deltaTimeMs,
    edgeZonePx,
    maxSpeedPxPerSec,
  );
  const yIntention = resolveAxisIntention(
    entries,
    measurement,
    'y',
    pointer.y,
    deltaTimeMs,
    edgeZonePx,
    maxSpeedPxPerSec,
  );

  if (!xIntention && !yIntention) {
    return {
      x: { scrolled: false, element: null },
      y: { scrolled: false, element: null },
      measurement,
    };
  }

  if (xIntention && yIntention && xIntention.targetIndex === yIntention.targetIndex) {
    const element = scrollTarget(entries, xIntention.targetIndex, {
      left: xIntention.delta,
      top: yIntention.delta,
    });
    return {
      x: { scrolled: true, element },
      y: { scrolled: true, element },
      measurement,
    };
  }

  const xElement = xIntention
    ? scrollTarget(entries, xIntention.targetIndex, { left: xIntention.delta })
    : null;
  const yElement = yIntention
    ? scrollTarget(entries, yIntention.targetIndex, { top: yIntention.delta })
    : null;

  return {
    x: { scrolled: xIntention !== null, element: xElement },
    y: { scrolled: yIntention !== null, element: yElement },
    measurement,
  };
};
