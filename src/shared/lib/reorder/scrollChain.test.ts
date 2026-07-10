import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildScrollChain,
  canScrollElementOnAxis,
  computeEdgeIntensity,
  computeScrollDelta,
  getVisibleClientRect,
  runAutoscrollTick,
} from './scrollChain';

const stubRect = (
  el: Element,
  rect: { left: number; top: number; width: number; height: number },
) => {
  const domRect: DOMRect = {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => rect,
  };

  el.getBoundingClientRect = () => domRect;
};

const stubScrollMetrics = (
  el: Element,
  metrics: {
    scrollWidth?: number;
    scrollHeight?: number;
    clientWidth?: number;
    clientHeight?: number;
    scrollLeft?: number;
    scrollTop?: number;
  },
) => {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(el, key, { value, configurable: true });
  }
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('computeEdgeIntensity', () => {
  it('returns 0 outside both edge zones', () => {
    expect(computeEdgeIntensity(50, 0, 100, 10)).toBe(0);
  });

  it('returns increasingly negative intensity approaching the start edge', () => {
    expect(computeEdgeIntensity(5, 0, 100, 10)).toBeCloseTo(-0.5);
    expect(computeEdgeIntensity(0, 0, 100, 10)).toBe(-1);
  });

  it('returns increasingly positive intensity approaching the end edge', () => {
    expect(computeEdgeIntensity(95, 0, 100, 10)).toBeCloseTo(0.5);
    expect(computeEdgeIntensity(100, 0, 100, 10)).toBe(1);
  });

  it('clamps to maximum intensity when the pointer is beyond the visible edge', () => {
    expect(computeEdgeIntensity(-20, 0, 100, 10)).toBe(-1);
    expect(computeEdgeIntensity(150, 0, 100, 10)).toBe(1);
  });

  it('returns 0 for a degenerate (empty) visible extent', () => {
    expect(computeEdgeIntensity(5, 10, 10, 10)).toBe(0);
  });
});

describe('computeScrollDelta', () => {
  it('scales linearly with intensity, speed, and elapsed time', () => {
    expect(computeScrollDelta(1, 1000, 900)).toBe(900);
    expect(computeScrollDelta(0.5, 1000, 900)).toBe(450);
    expect(computeScrollDelta(-1, 500, 900)).toBe(-450);
  });
});

describe('canScrollElementOnAxis', () => {
  it('is false when overflow does not permit scrolling', () => {
    const el = document.createElement('div');
    el.style.overflowY = 'visible';
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 50 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });

  it('is false when content is not actually larger than the client area', () => {
    const el = document.createElement('div');
    el.style.overflowY = 'auto';
    stubScrollMetrics(el, { scrollHeight: 100, clientHeight: 100, scrollTop: 0 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });

  it('is false at the start limit when scrolling toward the start', () => {
    const el = document.createElement('div');
    el.style.overflowY = 'auto';
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 0 });

    expect(canScrollElementOnAxis(el, 'y', -1)).toBe(false);
  });

  it('is false at the end limit when scrolling toward the end', () => {
    const el = document.createElement('div');
    el.style.overflowY = 'auto';
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 400 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });

  it('is true when still able to scroll further in the requested direction', () => {
    const el = document.createElement('div');
    document.body.append(el);
    el.style.overflowY = 'scroll';
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 200 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(true);
    expect(canScrollElementOnAxis(el, 'y', -1)).toBe(true);
  });

  it('checks the requested axis independently from the other axis', () => {
    const el = document.createElement('div');
    document.body.append(el);
    el.style.overflowX = 'auto';
    el.style.overflowY = 'visible';
    stubScrollMetrics(el, {
      scrollWidth: 500,
      clientWidth: 100,
      scrollLeft: 200,
      scrollHeight: 500,
      clientHeight: 100,
      scrollTop: 200,
    });

    expect(canScrollElementOnAxis(el, 'x', 1)).toBe(true);
    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });
});

describe('buildScrollChain', () => {
  it('orders the container first, then ancestors nearest-first, ending with the document scrolling element', () => {
    const grandparent = document.createElement('div');
    const parent = document.createElement('div');
    const container = document.createElement('div');
    grandparent.append(parent);
    parent.append(container);
    document.body.append(grandparent);

    const chain = buildScrollChain(container);

    expect(chain[0]).toBe(container);
    expect(chain[1]).toBe(parent);
    expect(chain[2]).toBe(grandparent);
    expect(chain[chain.length - 1]).toBe(document.scrollingElement ?? document.documentElement);
  });
});

describe('getVisibleClientRect', () => {
  it('clips the element rect by its ancestor rects and the viewport', () => {
    const ancestor = document.createElement('div');
    const el = document.createElement('div');
    document.body.append(ancestor, el);

    stubRect(ancestor, { left: 0, top: 0, width: 200, height: 200 });
    stubRect(el, { left: 100, top: 100, width: 300, height: 300 });

    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

    const visible = getVisibleClientRect(el, [ancestor]);

    expect(visible).toEqual({ left: 100, top: 100, width: 100, height: 100 });

    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true,
    });
  });
});

describe('runAutoscrollTick', () => {
  it('scrolls the nearest eligible chain target', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    document.body.append(outer, inner);
    stubRect(inner, { left: 0, top: 0, width: 200, height: 200 });
    stubRect(outer, { left: 0, top: 0, width: 400, height: 400 });
    inner.style.overflowY = 'auto';
    stubScrollMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 200 });
    outer.style.overflowY = 'auto';
    stubScrollMetrics(outer, { scrollHeight: 500, clientHeight: 400, scrollTop: 200 });
    const innerScrollBy = vi.fn();
    const outerScrollBy = vi.fn();
    inner.scrollBy = innerScrollBy;
    outer.scrollBy = outerScrollBy;

    const result = runAutoscrollTick([inner, outer], { x: 100, y: 198 }, 16, 10, 900);

    expect(result.y.scrolled).toBe(true);
    expect(result.y.element).toBe(inner);
    expect(innerScrollBy).toHaveBeenCalledTimes(1);
    expect(outerScrollBy).not.toHaveBeenCalled();
  });

  it('falls back to the next ancestor once the nearest target reaches its limit', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    document.body.append(outer, inner);
    // Inner shares its bottom edge with outer, so the pointer near that shared
    // edge is inside both targets' own edge zones.
    stubRect(inner, { left: 0, top: 0, width: 200, height: 200 });
    stubRect(outer, { left: 0, top: 0, width: 400, height: 200 });
    inner.style.overflowY = 'auto';
    // Inner is already at its scroll limit toward the end.
    stubScrollMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 300 });
    outer.style.overflowY = 'auto';
    stubScrollMetrics(outer, { scrollHeight: 500, clientHeight: 200, scrollTop: 200 });
    const innerScrollBy = vi.fn();
    const outerScrollBy = vi.fn();
    inner.scrollBy = innerScrollBy;
    outer.scrollBy = outerScrollBy;

    const result = runAutoscrollTick([inner, outer], { x: 100, y: 198 }, 16, 10, 900);

    expect(innerScrollBy).not.toHaveBeenCalled();
    expect(result.y.scrolled).toBe(true);
    expect(result.y.element).toBe(outer);
    expect(outerScrollBy).toHaveBeenCalledTimes(1);
  });

  it('does nothing on an axis when the pointer is outside every chain target edge zone', () => {
    const el = document.createElement('div');
    document.body.append(el);
    stubRect(el, { left: 0, top: 0, width: 400, height: 400 });
    el.style.overflow = 'auto';
    stubScrollMetrics(el, {
      scrollWidth: 500,
      clientWidth: 400,
      scrollLeft: 50,
      scrollHeight: 500,
      clientHeight: 400,
      scrollTop: 50,
    });
    const elScrollBy = vi.fn();
    el.scrollBy = elScrollBy;

    const result = runAutoscrollTick([el], { x: 200, y: 200 }, 16, 10, 900);

    expect(result.x.scrolled).toBe(false);
    expect(result.y.scrolled).toBe(false);
    expect(elScrollBy).not.toHaveBeenCalled();
  });
});
