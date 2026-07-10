import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildScrollChain,
  canScrollElementOnAxis,
  canScrollViewportOnAxis,
  computeEdgeIntensity,
  computeScrollDelta,
  didAutoscroll,
  getContainerVisibleRect,
  measureScrollChain,
  runAutoscrollTick,
  type ScrollChainEntry,
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

const stubViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
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
  it('is false when content is not actually larger than the client area', () => {
    const el = document.createElement('div');
    stubScrollMetrics(el, { scrollHeight: 100, clientHeight: 100, scrollTop: 0 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });

  it('is false at the start limit when scrolling toward the start', () => {
    const el = document.createElement('div');
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 0 });

    expect(canScrollElementOnAxis(el, 'y', -1)).toBe(false);
  });

  it('is false at the end limit when scrolling toward the end', () => {
    const el = document.createElement('div');
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 400 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });

  it('is true when still able to scroll further in the requested direction', () => {
    const el = document.createElement('div');
    stubScrollMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 200 });

    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(true);
    expect(canScrollElementOnAxis(el, 'y', -1)).toBe(true);
  });

  it('checks the requested axis independently from the other axis', () => {
    const el = document.createElement('div');
    stubScrollMetrics(el, {
      scrollWidth: 500,
      clientWidth: 100,
      scrollLeft: 200,
      scrollHeight: 100,
      clientHeight: 100,
      scrollTop: 0,
    });

    expect(canScrollElementOnAxis(el, 'x', 1)).toBe(true);
    expect(canScrollElementOnAxis(el, 'y', 1)).toBe(false);
  });
});

describe('canScrollViewportOnAxis', () => {
  const originalScrollingElement = Object.getOwnPropertyDescriptor(document, 'scrollingElement');

  const stubScrollingElement = (el: Element) => {
    Object.defineProperty(document, 'scrollingElement', { value: el, configurable: true });
  };

  afterEach(() => {
    if (originalScrollingElement) {
      Object.defineProperty(document, 'scrollingElement', originalScrollingElement);
    }
  });

  it('is false when the document is not actually larger than the viewport', () => {
    const scrollingEl = document.createElement('html');
    stubScrollMetrics(scrollingEl, { scrollHeight: 800 });
    stubScrollingElement(scrollingEl);
    stubViewport(1000, 800);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

    expect(canScrollViewportOnAxis('y', 1)).toBe(false);
  });

  it('is false at the start/end viewport scroll limits', () => {
    const scrollingEl = document.createElement('html');
    stubScrollMetrics(scrollingEl, { scrollHeight: 2000 });
    stubScrollingElement(scrollingEl);
    stubViewport(1000, 800);

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    expect(canScrollViewportOnAxis('y', -1)).toBe(false);

    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true });
    expect(canScrollViewportOnAxis('y', 1)).toBe(false);
  });

  it('is true mid-range in either direction', () => {
    const scrollingEl = document.createElement('html');
    stubScrollMetrics(scrollingEl, { scrollHeight: 2000 });
    stubScrollingElement(scrollingEl);
    stubViewport(1000, 800);
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });

    expect(canScrollViewportOnAxis('y', 1)).toBe(true);
    expect(canScrollViewportOnAxis('y', -1)).toBe(true);
  });
});

describe('buildScrollChain', () => {
  it('orders the container first, then ancestors nearest-first', () => {
    const grandparent = document.createElement('div');
    const parent = document.createElement('div');
    const container = document.createElement('div');
    grandparent.append(parent);
    parent.append(container);
    document.body.append(grandparent);

    const chain = buildScrollChain(container);

    expect(chain[0]?.element).toBe(container);
    expect(chain[1]?.element).toBe(parent);
    expect(chain[2]?.element).toBe(grandparent);
  });

  it('tags scroll-candidate and clipping eligibility per axis from computed overflow', () => {
    const container = document.createElement('div');
    container.style.overflowX = 'visible';
    container.style.overflowY = 'auto';
    document.body.append(container);

    const [entry] = buildScrollChain(container);

    expect(entry).toMatchObject({
      scrollCandidateX: false,
      scrollCandidateY: true,
      clipsX: false,
      clipsY: true,
    });
  });

  it('treats overflow: hidden and clip as clipping but not scroll-eligible', () => {
    const hidden = document.createElement('div');
    hidden.style.overflowY = 'hidden';
    document.body.append(hidden);
    const [hiddenEntry] = buildScrollChain(hidden);
    expect(hiddenEntry).toMatchObject({ scrollCandidateY: false, clipsY: true });
  });
});

describe('measureScrollChain', () => {
  it('does not clip visible bounds through an overflow: visible ancestor', () => {
    const ancestor = document.createElement('div');
    const container = document.createElement('div');
    document.body.append(ancestor, container);
    stubRect(ancestor, { left: 0, top: 0, width: 50, height: 50 });
    stubRect(container, { left: 100, top: 100, width: 300, height: 300 });
    stubViewport(1000, 1000);

    const entries: ScrollChainEntry[] = [
      {
        element: container,
        scrollCandidateX: false,
        scrollCandidateY: false,
        clipsX: false,
        clipsY: false,
      },
      {
        element: ancestor,
        scrollCandidateX: false,
        scrollCandidateY: false,
        clipsX: false,
        clipsY: false,
      },
    ];

    const measurement = measureScrollChain(entries);

    expect(measurement.entryVisibleRects[0]).toEqual({
      left: 100,
      top: 100,
      width: 300,
      height: 300,
    });
  });

  it('clips visible bounds through a genuinely clipping ancestor (hidden/clip/auto/scroll)', () => {
    for (const overflowValue of ['hidden', 'clip', 'auto', 'scroll']) {
      document.body.innerHTML = '';
      const ancestor = document.createElement('div');
      const container = document.createElement('div');
      document.body.append(ancestor, container);
      stubRect(ancestor, { left: 0, top: 0, width: 200, height: 200 });
      stubRect(container, { left: 100, top: 100, width: 300, height: 300 });
      stubViewport(1000, 1000);

      const entries: ScrollChainEntry[] = [
        {
          element: container,
          scrollCandidateX: false,
          scrollCandidateY: false,
          clipsX: false,
          clipsY: false,
        },
        {
          element: ancestor,
          scrollCandidateX: false,
          scrollCandidateY: false,
          clipsX: overflowValue !== 'visible',
          clipsY: overflowValue !== 'visible',
        },
      ];

      const measurement = measureScrollChain(entries);

      expect(measurement.entryVisibleRects[0]).toEqual({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
      });
    }
  });

  it('always clips through the viewport', () => {
    const container = document.createElement('div');
    document.body.append(container);
    stubRect(container, { left: -50, top: -50, width: 300, height: 300 });
    stubViewport(200, 200);

    const entries: ScrollChainEntry[] = [
      {
        element: container,
        scrollCandidateX: false,
        scrollCandidateY: false,
        clipsX: false,
        clipsY: false,
      },
    ];

    const measurement = measureScrollChain(entries);

    expect(measurement.entryVisibleRects[0]).toEqual({ left: 0, top: 0, width: 200, height: 200 });
  });

  it('reads each ancestor bounding rect exactly once regardless of chain depth (linear, not quadratic)', () => {
    const outer = document.createElement('div');
    const middle = document.createElement('div');
    const inner = document.createElement('div');
    document.body.append(outer, middle, inner);
    stubRect(outer, { left: 0, top: 0, width: 500, height: 500 });
    stubRect(middle, { left: 0, top: 0, width: 400, height: 400 });
    stubRect(inner, { left: 0, top: 0, width: 300, height: 300 });
    stubViewport(1000, 1000);

    const outerSpy = vi.spyOn(outer, 'getBoundingClientRect');
    const middleSpy = vi.spyOn(middle, 'getBoundingClientRect');
    const innerSpy = vi.spyOn(inner, 'getBoundingClientRect');

    const entries: ScrollChainEntry[] = [
      {
        element: inner,
        scrollCandidateX: true,
        scrollCandidateY: true,
        clipsX: true,
        clipsY: true,
      },
      {
        element: middle,
        scrollCandidateX: true,
        scrollCandidateY: true,
        clipsX: true,
        clipsY: true,
      },
      {
        element: outer,
        scrollCandidateX: true,
        scrollCandidateY: true,
        clipsX: true,
        clipsY: true,
      },
    ];

    measureScrollChain(entries);

    expect(innerSpy).toHaveBeenCalledTimes(1);
    expect(middleSpy).toHaveBeenCalledTimes(1);
    expect(outerSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getContainerVisibleRect', () => {
  it('returns the first chain entry visible rect', () => {
    const container = document.createElement('div');
    document.body.append(container);
    stubRect(container, { left: 10, top: 20, width: 100, height: 100 });
    stubViewport(1000, 1000);

    const entries: ScrollChainEntry[] = [
      {
        element: container,
        scrollCandidateX: false,
        scrollCandidateY: false,
        clipsX: false,
        clipsY: false,
      },
    ];
    const measurement = measureScrollChain(entries);

    expect(getContainerVisibleRect(entries, measurement)).toEqual({
      left: 10,
      top: 20,
      width: 100,
      height: 100,
    });
  });
});

describe('runAutoscrollTick', () => {
  it('scrolls the nearest eligible chain target', () => {
    const inner = document.createElement('div');
    const outer = document.createElement('div');
    document.body.append(outer, inner);
    stubRect(inner, { left: 0, top: 0, width: 200, height: 200 });
    stubRect(outer, { left: 0, top: 0, width: 400, height: 400 });
    stubViewport(1000, 1000);
    stubScrollMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 200 });
    stubScrollMetrics(outer, { scrollHeight: 500, clientHeight: 400, scrollTop: 200 });
    const innerScrollBy = vi.fn();
    const outerScrollBy = vi.fn();
    inner.scrollBy = innerScrollBy;
    outer.scrollBy = outerScrollBy;

    const entries: ScrollChainEntry[] = [
      {
        element: inner,
        scrollCandidateX: false,
        scrollCandidateY: true,
        clipsX: false,
        clipsY: true,
      },
      {
        element: outer,
        scrollCandidateX: false,
        scrollCandidateY: true,
        clipsX: false,
        clipsY: true,
      },
    ];

    const result = runAutoscrollTick(entries, { x: 100, y: 198 }, 16, 10, 900);

    expect(result.y.scrolled).toBe(true);
    expect(result.y.element).toBe(inner);
    expect(innerScrollBy).toHaveBeenCalledTimes(1);
    expect(outerScrollBy).not.toHaveBeenCalled();
    expect(didAutoscroll(result)).toBe(true);
  });

  it('falls back to the next ancestor once the nearest target reaches its limit', () => {
    const inner = document.createElement('div');
    const outer = document.createElement('div');
    document.body.append(outer, inner);
    stubRect(inner, { left: 0, top: 0, width: 200, height: 200 });
    stubRect(outer, { left: 0, top: 0, width: 400, height: 200 });
    stubViewport(1000, 1000);
    stubScrollMetrics(inner, { scrollHeight: 500, clientHeight: 200, scrollTop: 300 });
    stubScrollMetrics(outer, { scrollHeight: 500, clientHeight: 200, scrollTop: 200 });
    const innerScrollBy = vi.fn();
    const outerScrollBy = vi.fn();
    inner.scrollBy = innerScrollBy;
    outer.scrollBy = outerScrollBy;

    const entries: ScrollChainEntry[] = [
      {
        element: inner,
        scrollCandidateX: false,
        scrollCandidateY: true,
        clipsX: false,
        clipsY: true,
      },
      {
        element: outer,
        scrollCandidateX: false,
        scrollCandidateY: true,
        clipsX: false,
        clipsY: true,
      },
    ];

    const result = runAutoscrollTick(entries, { x: 100, y: 198 }, 16, 10, 900);

    expect(innerScrollBy).not.toHaveBeenCalled();
    expect(result.y.scrolled).toBe(true);
    expect(result.y.element).toBe(outer);
    expect(outerScrollBy).toHaveBeenCalledTimes(1);
  });

  it('does nothing on an axis when the pointer is outside every chain target edge zone', () => {
    const el = document.createElement('div');
    document.body.append(el);
    stubRect(el, { left: 0, top: 0, width: 400, height: 400 });
    stubViewport(1000, 1000);
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

    const entries: ScrollChainEntry[] = [
      { element: el, scrollCandidateX: true, scrollCandidateY: true, clipsX: true, clipsY: true },
    ];

    const result = runAutoscrollTick(entries, { x: 200, y: 200 }, 16, 10, 900);

    expect(result.x.scrolled).toBe(false);
    expect(result.y.scrolled).toBe(false);
    expect(didAutoscroll(result)).toBe(false);
    expect(elScrollBy).not.toHaveBeenCalled();
  });

  it('combines X and Y into a single scrollBy call when both axes select the same target', () => {
    const el = document.createElement('div');
    document.body.append(el);
    stubRect(el, { left: 0, top: 0, width: 200, height: 200 });
    stubViewport(1000, 1000);
    stubScrollMetrics(el, {
      scrollWidth: 500,
      clientWidth: 200,
      scrollLeft: 200,
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 200,
    });
    const scrollBy = vi.fn<(delta: { left?: number; top?: number }) => void>();
    el.scrollBy = scrollBy;

    const entries: ScrollChainEntry[] = [
      { element: el, scrollCandidateX: true, scrollCandidateY: true, clipsX: true, clipsY: true },
    ];

    const result = runAutoscrollTick(entries, { x: 199, y: 199 }, 16, 10, 900);

    expect(scrollBy).toHaveBeenCalledTimes(1);
    const callArgs = scrollBy.mock.calls[0]?.[0];
    expect(callArgs?.left).toBeGreaterThan(0);
    expect(callArgs?.top).toBeGreaterThan(0);
    expect(result.x.element).toBe(el);
    expect(result.y.element).toBe(el);
  });

  it('falls back to the viewport when no chain element is eligible', () => {
    const originalScrollingElement = Object.getOwnPropertyDescriptor(document, 'scrollingElement');
    const scrollingEl = document.createElement('html');
    Object.defineProperty(document, 'scrollingElement', { value: scrollingEl, configurable: true });
    stubScrollMetrics(scrollingEl, { scrollHeight: 2000 });
    stubViewport(1000, 800);
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });

    const el = document.createElement('div');
    document.body.append(el);
    stubRect(el, { left: 0, top: 0, width: 1000, height: 800 });
    // Not a scroll candidate on either axis, so el itself can never be scrolled.
    const entries: ScrollChainEntry[] = [
      {
        element: el,
        scrollCandidateX: false,
        scrollCandidateY: false,
        clipsX: false,
        clipsY: false,
      },
    ];

    const windowScrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);

    const result = runAutoscrollTick(entries, { x: 500, y: 796 }, 16, 10, 900);

    expect(windowScrollBy).toHaveBeenCalledTimes(1);
    expect(result.y.scrolled).toBe(true);
    expect(result.y.element).toBe(scrollingEl);

    windowScrollBy.mockRestore();
    if (originalScrollingElement) {
      Object.defineProperty(document, 'scrollingElement', originalScrollingElement);
    }
  });
});

describe('didAutoscroll', () => {
  it('is true when either axis scrolled', () => {
    expect(
      didAutoscroll({
        x: { scrolled: true, element: null },
        y: { scrolled: false, element: null },
        measurement: {
          entryRects: [],
          entryVisibleRects: [],
          viewportRect: { left: 0, top: 0, width: 0, height: 0 },
        },
      }),
    ).toBe(true);
  });

  it('is false when neither axis scrolled', () => {
    expect(
      didAutoscroll({
        x: { scrolled: false, element: null },
        y: { scrolled: false, element: null },
        measurement: {
          entryRects: [],
          entryVisibleRects: [],
          viewportRect: { left: 0, top: 0, width: 0, height: 0 },
        },
      }),
    ).toBe(false);
  });
});
