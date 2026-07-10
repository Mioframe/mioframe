import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReorderAutoScroll } from './reorderAutoScroll';

const stubContainer = ({
  visibleTop = 0,
  visibleBottom = 400,
  scrollTop = 0,
  scrollHeight = 1000,
  clientHeight = 400,
}: {
  visibleTop?: number;
  visibleBottom?: number;
  scrollTop?: number;
  scrollHeight?: number;
  clientHeight?: number;
} = {}): HTMLElement => {
  const container = document.createElement('div');

  document.body.appendChild(container);
  container.getBoundingClientRect = (): DOMRect => ({
    top: visibleTop,
    bottom: visibleBottom,
    height: visibleBottom - visibleTop,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: visibleTop,
    toJSON: () => ({}),
  });
  Object.defineProperty(container, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: clientHeight, configurable: true });
  container.scrollTop = scrollTop;
  return container;
};

const stubRaf = () => {
  const queue: FrameRequestCallback[] = [];
  const rafMock = vi.fn((callback: FrameRequestCallback) => {
    queue.push(callback);
    return queue.length;
  });
  const cafMock = vi.fn();

  vi.stubGlobal('requestAnimationFrame', rafMock);
  vi.stubGlobal('cancelAnimationFrame', cafMock);

  return {
    rafMock,
    cafMock,
    flushOne: () => queue.shift()?.(0),
  };
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('createReorderAutoScroll', () => {
  it('does nothing outside the edge zones', () => {
    const container = stubContainer();
    const { rafMock } = stubRaf();
    const onScrollStep = vi.fn();
    const autoScroll = createReorderAutoScroll({ containerEl: container, onScrollStep });

    autoScroll.update(200); // dead center of a 0..400 visible area

    expect(rafMock).not.toHaveBeenCalled();
    expect(container.scrollTop).toBe(0);
  });

  it('scrolls down through requestAnimationFrame near the bottom edge and reports the step', () => {
    const container = stubContainer({ scrollTop: 0 });
    const { flushOne, rafMock, cafMock } = stubRaf();
    const onScrollStep = vi.fn();
    const autoScroll = createReorderAutoScroll({ containerEl: container, onScrollStep });

    autoScroll.update(395); // 5px from the bottom edge (400), inside the 36px zone

    expect(rafMock).toHaveBeenCalledTimes(1);

    flushOne();

    expect(container.scrollTop).toBeGreaterThan(0);
    expect(onScrollStep).toHaveBeenCalledTimes(1);
    // setInterval is never used for the scroll loop.
    expect(cafMock).not.toHaveBeenCalled();
    autoScroll.stop();
  });

  it('scrolls up near the top edge', () => {
    const container = stubContainer({ scrollTop: 200 });
    const { flushOne } = stubRaf();
    const onScrollStep = vi.fn();
    const autoScroll = createReorderAutoScroll({ containerEl: container, onScrollStep });

    autoScroll.update(5); // 5px from the top edge (0)
    flushOne();

    expect(container.scrollTop).toBeLessThan(200);
    expect(onScrollStep).toHaveBeenCalledTimes(1);
    autoScroll.stop();
  });

  it('applies a bounded speed curve based on distance into the edge zone', () => {
    const shallow = stubContainer({ scrollTop: 0 });
    const shallowRaf = stubRaf();
    const shallowScroll = createReorderAutoScroll({ containerEl: shallow, onScrollStep: vi.fn() });

    shallowScroll.update(399); // 1px from the edge: near-maximum strength
    shallowRaf.flushOne();
    const shallowStep = shallow.scrollTop;

    const deep = stubContainer({ scrollTop: 0 });
    vi.unstubAllGlobals();
    const deepRaf = stubRaf();
    const deepScroll = createReorderAutoScroll({ containerEl: deep, onScrollStep: vi.fn() });

    deepScroll.update(370); // 30px from the edge: weaker strength, still inside the zone
    deepRaf.flushOne();
    const deepStep = deep.scrollTop;

    expect(shallowStep).toBeGreaterThan(deepStep);
    expect(shallowStep).toBeLessThanOrEqual(14); // bounded by the max speed
    shallowScroll.stop();
    deepScroll.stop();
  });

  it('does nothing when the container cannot scroll further in that direction', () => {
    // scrollHeight - clientHeight = 600: already at the maximum scrollTop.
    const container = stubContainer({ scrollTop: 600, scrollHeight: 1000, clientHeight: 400 });
    const { rafMock } = stubRaf();
    const onScrollStep = vi.fn();
    const autoScroll = createReorderAutoScroll({ containerEl: container, onScrollStep });

    autoScroll.update(395); // inside the bottom edge zone, but nowhere left to scroll

    expect(rafMock).not.toHaveBeenCalled();
    expect(onScrollStep).not.toHaveBeenCalled();
  });

  it('stops scheduling further frames once stop() is called', () => {
    const container = stubContainer({ scrollTop: 0 });
    const { flushOne, rafMock, cafMock } = stubRaf();
    const autoScroll = createReorderAutoScroll({ containerEl: container, onScrollStep: vi.fn() });

    autoScroll.update(395);
    expect(rafMock).toHaveBeenCalledTimes(1);

    autoScroll.stop();
    expect(cafMock).toHaveBeenCalledTimes(1);

    rafMock.mockClear();
    flushOne(); // the pending callback still exists in the queue, but stop() zeroed velocity
    expect(rafMock).not.toHaveBeenCalled();
  });

  it('does not scroll a container with no scrollable overflow', () => {
    const container = stubContainer({ scrollTop: 0, scrollHeight: 400, clientHeight: 400 });
    const { rafMock } = stubRaf();
    const autoScroll = createReorderAutoScroll({ containerEl: container, onScrollStep: vi.fn() });

    autoScroll.update(395);

    expect(rafMock).not.toHaveBeenCalled();
  });
});
