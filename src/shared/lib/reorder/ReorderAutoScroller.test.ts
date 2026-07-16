import { Draggable } from '@dnd-kit/dom';
import { DragDropManager } from '@dnd-kit/dom';
import {
  canScroll,
  detectScrollIntent,
  getVisibleBoundingRectangle,
  ScrollDirection,
} from '@dnd-kit/dom/utilities';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReorderAutoScroller, runReorderAutoscrollFrame } from './ReorderAutoScroller';

vi.mock('@dnd-kit/dom/utilities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/dom/utilities')>();
  return {
    ...actual,
    detectScrollIntent: vi.fn(),
    canScroll: vi.fn(),
    getVisibleBoundingRectangle: vi.fn(),
  };
});

const mockedDetectScrollIntent = vi.mocked(detectScrollIntent);
const mockedCanScroll = vi.mocked(canScroll);
const mockedGetVisibleBoundingRectangle = vi.mocked(getVisibleBoundingRectangle);

const idleIntent = {
  direction: { x: ScrollDirection.Idle, y: ScrollDirection.Idle },
  speed: { x: 0, y: 0 },
};

const alwaysScrollable = {
  top: true,
  bottom: true,
  left: true,
  right: true,
  x: true,
  y: true,
};

type Rect = { top: number; right: number; bottom: number; left: number };

const stubRect = (element: Element, rect: Rect): void => {
  Object.assign(element, {
    getBoundingClientRect: () => ({
      ...rect,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }),
  });
};

const createElement = (parent: Element = document.body): HTMLElement => {
  const element = document.createElement('div');
  parent.append(element);
  return element;
};

beforeEach(() => {
  mockedDetectScrollIntent.mockReset().mockReturnValue(idleIntent);
  mockedCanScroll.mockReset().mockReturnValue(alwaysScrollable);
  mockedGetVisibleBoundingRectangle
    .mockReset()
    .mockImplementation((element) => element.getBoundingClientRect());
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('runReorderAutoscrollFrame', () => {
  const useRealScrollIntentDetection = async (): Promise<void> => {
    const actualUtilities =
      await vi.importActual<typeof import('@dnd-kit/dom/utilities')>('@dnd-kit/dom/utilities');
    mockedDetectScrollIntent.mockImplementation(actualUtilities.detectScrollIntent);
  };

  const createStronglyClippedContainer = () => {
    const container = createElement();
    stubRect(container, { top: 0, bottom: 1000, left: 0, right: 1000 });
    mockedGetVisibleBoundingRectangle.mockReturnValue({
      top: 100,
      bottom: 200,
      left: 100,
      right: 200,
      width: 100,
      height: 100,
    });
    Object.defineProperties(container, {
      clientHeight: { configurable: true, value: 1000 },
      scrollHeight: { configurable: true, value: 2000 },
      clientWidth: { configurable: true, value: 1000 },
      scrollWidth: { configurable: true, value: 2000 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    return { container, source };
  };

  it('uses real dnd-kit intent detection at a clipped visible edge outside the old full-rectangle zone', async () => {
    await useRealScrollIntentDetection();

    const { container, source } = createStronglyClippedContainer();
    const manager = { dragOperation: { position: { current: { x: 150, y: 190 } }, source } };

    runReorderAutoscrollFrame(manager, container, [container]);

    // y=190 is far outside the old full-rectangle bottom zone (800..1000), but is 90% through
    // the visible 100..200 slice and therefore projects to y=900 in that same full rectangle.
    expect(container.scrollTop).toBeGreaterThan(0);
    expect(container.scrollTop).toBeLessThan(25);
  });

  it('bounds real projected speed at and beyond a strongly clipped visible edge', async () => {
    await useRealScrollIntentDetection();
    const { container, source } = createStronglyClippedContainer();

    const runAt = (x: number, y: number): { x: number; y: number } => {
      container.scrollLeft = 0;
      container.scrollTop = 0;
      runReorderAutoscrollFrame(
        { dragOperation: { position: { current: { x, y } }, source } },
        container,
        [container],
      );
      return { x: container.scrollLeft, y: container.scrollTop };
    };

    expect(runAt(150, 200).y).toBeLessThanOrEqual(25);
    expect(runAt(150, 202).y).toBe(25);
  });

  it('caps X and Y independently before resolving the frame delta', () => {
    const { container, source } = createStronglyClippedContainer();
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Forward, y: ScrollDirection.Forward },
      speed: { x: 40, y: 10 },
    });

    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 200, y: 200 } }, source } },
      container,
      [container],
    );

    expect({ x: container.scrollLeft, y: container.scrollTop }).toEqual({ x: 25, y: 10 });
  });

  it('lets the outer-ancestor visibility clamp reduce bounded speed further', () => {
    const container = createElement();
    stubRect(container, { top: 0, bottom: 103, left: 0, right: 100 });
    const ancestor = createElement();
    stubRect(ancestor, { top: 0, bottom: 100, left: 0, right: 100 });
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 100 },
    });
    const source = { element: container.appendChild(document.createElement('div')) };

    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 50, y: 100 } }, source } },
      container,
      [ancestor],
    );

    expect(ancestor.scrollTop).toBe(2);
  });

  it('preserves dnd-kit orthogonal tolerance for projected coordinates outside the candidate', async () => {
    await useRealScrollIntentDetection();
    const { container, source } = createStronglyClippedContainer();

    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 80, y: 202 } }, source } },
      container,
      [container],
    );

    expect(container.scrollTop).toBe(0);
  });

  it('applies both axes through one combined instant scrollTo call', () => {
    const container = createElement();
    stubRect(container, { top: 100, bottom: 200, left: 0, right: 200 });
    container.scrollTop = 5;
    container.scrollLeft = 3;

    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Forward, y: ScrollDirection.Forward },
      speed: { x: 4, y: 10 },
    });

    const scrollToSpy = vi.spyOn(container, 'scrollTo');

    const source = { element: container.appendChild(document.createElement('div')) };
    const manager = { dragOperation: { position: { current: { x: 0, y: 0 } }, source } };

    runReorderAutoscrollFrame(manager, container, [container]);

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenCalledWith({ left: 7, top: 15, behavior: 'instant' });
  });

  it('does not reapply an axis already resolved by a nearer candidate', () => {
    const container = createElement();
    stubRect(container, { top: 100, bottom: 200, left: 0, right: 50 });

    const nearer = createElement();
    stubRect(nearer, { top: 100, bottom: 150, left: 0, right: 50 });
    nearer.scrollTop = 0;

    const farther = createElement();
    stubRect(farther, { top: 100, bottom: 160, left: 0, right: 50 });
    farther.scrollTop = 0;

    mockedDetectScrollIntent.mockImplementation((candidate) => {
      if (candidate === nearer) {
        return {
          direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
          speed: { x: 0, y: 10 },
        };
      }
      if (candidate === farther) {
        return {
          direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
          speed: { x: 0, y: 15 },
        };
      }
      return idleIntent;
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    const manager = { dragOperation: { position: { current: { x: 0, y: 0 } }, source } };

    runReorderAutoscrollFrame(manager, container, [nearer, farther]);

    expect(nearer.scrollTop).toBe(10);
    expect(farther.scrollTop).toBe(0);
  });

  it('gives forward Y ownership to an ancestor while the container bottom edge is hidden', () => {
    const ancestor = createElement();
    const container = createElement(ancestor);
    stubRect(ancestor, { top: 0, bottom: 100, left: 0, right: 100 });
    stubRect(container, { top: 20, bottom: 140, left: 0, right: 100 });
    mockedGetVisibleBoundingRectangle.mockImplementation((element) =>
      element === ancestor
        ? { top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100 }
        : element.getBoundingClientRect(),
    );
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 10 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 50, y: 100 } }, source } },
      container,
      [container, ancestor],
    );

    expect(container.scrollTop).toBe(0);
    expect(ancestor.scrollTop).toBe(10);
  });

  it('transfers forward Y ownership to the container once its bottom edge is visible', () => {
    const ancestor = createElement();
    const container = createElement(ancestor);
    stubRect(ancestor, { top: 0, bottom: 140, left: 0, right: 100 });
    stubRect(container, { top: 20, bottom: 140, left: 0, right: 100 });
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 10 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 50, y: 138 } }, source } },
      container,
      [container, ancestor],
    );

    expect(container.scrollTop).toBe(10);
    expect(ancestor.scrollTop).toBe(0);
  });

  it('does not fall back to the ancestor at the inner lower limit while the bottom edge is visible', () => {
    const ancestor = createElement();
    const container = createElement(ancestor);
    stubRect(ancestor, { top: 0, bottom: 140, left: 0, right: 100 });
    stubRect(container, { top: 20, bottom: 140, left: 0, right: 100 });
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 10 },
    });
    mockedCanScroll.mockImplementation((element) => ({
      ...alwaysScrollable,
      bottom: element !== container,
    }));

    const source = { element: container.appendChild(document.createElement('div')) };
    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 50, y: 138 } }, source } },
      container,
      [container, ancestor],
    );

    expect(container.scrollTop).toBe(0);
    expect(ancestor.scrollTop).toBe(0);
  });

  it('makes the ancestor eligible again when the lower physical edge becomes clipped again', () => {
    const ancestor = createElement();
    const container = createElement(ancestor);
    let containerBottom = 140;
    stubRect(ancestor, { top: 0, bottom: 140, left: 0, right: 100 });
    Object.assign(container, {
      getBoundingClientRect: () => ({
        top: containerBottom - 120,
        bottom: containerBottom,
        left: 0,
        right: 100,
        width: 100,
        height: 120,
        x: 0,
        y: containerBottom - 120,
        toJSON: () => ({}),
      }),
    });
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 10 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    const manager = { dragOperation: { position: { current: { x: 50, y: 138 } }, source } };
    runReorderAutoscrollFrame(manager, container, [container, ancestor]);
    expect(container.scrollTop).toBe(10);
    expect(ancestor.scrollTop).toBe(0);

    containerBottom = 170;
    runReorderAutoscrollFrame(manager, container, [container, ancestor]);
    expect(container.scrollTop).toBe(10);
    expect(ancestor.scrollTop).toBe(10);
  });

  it('gives reverse Y ownership to an ancestor only while the container top edge is hidden', () => {
    const ancestor = createElement();
    const container = createElement(ancestor);
    let containerTop = -40;
    stubRect(ancestor, { top: 0, bottom: 100, left: 0, right: 100 });
    Object.assign(container, {
      getBoundingClientRect: () => ({
        top: containerTop,
        bottom: containerTop + 120,
        left: 0,
        right: 100,
        width: 100,
        height: 120,
        x: 0,
        y: containerTop,
        toJSON: () => ({}),
      }),
    });
    mockedGetVisibleBoundingRectangle.mockImplementation((element) =>
      element === ancestor
        ? { top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100 }
        : element.getBoundingClientRect(),
    );
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Reverse },
      speed: { x: 0, y: 10 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    const manager = { dragOperation: { position: { current: { x: 50, y: 2 } }, source } };
    runReorderAutoscrollFrame(manager, container, [container, ancestor]);
    expect(container.scrollTop).toBe(0);
    expect(ancestor.scrollTop).toBe(-10);

    containerTop = 0;
    ancestor.scrollTop = 0;
    runReorderAutoscrollFrame(manager, container, [container, ancestor]);
    expect(container.scrollTop).toBe(-10);
    expect(ancestor.scrollTop).toBe(0);
  });

  it('resolves clipped Y through the ancestor while visible X scrolls the container', () => {
    const ancestor = createElement();
    const container = createElement(ancestor);
    stubRect(ancestor, { top: 0, bottom: 100, left: 0, right: 140 });
    stubRect(container, { top: 20, bottom: 140, left: 20, right: 140 });
    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Forward, y: ScrollDirection.Forward },
      speed: { x: 7, y: 10 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    runReorderAutoscrollFrame(
      { dragOperation: { position: { current: { x: 138, y: 98 } }, source } },
      container,
      [container, ancestor],
    );

    expect({ x: container.scrollLeft, y: container.scrollTop }).toEqual({ x: 7, y: 0 });
    expect({ x: ancestor.scrollLeft, y: ancestor.scrollTop }).toEqual({ x: 0, y: 10 });
  });

  it('lets a farther candidate resolve an axis the nearer candidate left unresolved', () => {
    const container = createElement();
    stubRect(container, { top: 100, bottom: 200, left: 50, right: 150 });

    const nearer = createElement();
    stubRect(nearer, { top: 100, bottom: 200, left: 80, right: 150 });
    nearer.scrollLeft = 10;

    const farther = createElement();
    stubRect(farther, { top: 100, bottom: 160, left: 50, right: 150 });
    farther.scrollTop = 0;

    mockedDetectScrollIntent.mockImplementation((candidate) => {
      if (candidate === nearer) {
        return {
          direction: { x: ScrollDirection.Reverse, y: ScrollDirection.Idle },
          speed: { x: 5, y: 0 },
        };
      }
      if (candidate === farther) {
        return {
          direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
          speed: { x: 0, y: 8 },
        };
      }
      return idleIntent;
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    const manager = { dragOperation: { position: { current: { x: 0, y: 0 } }, source } };

    runReorderAutoscrollFrame(manager, container, [nearer, farther]);

    // X resolved by the nearer candidate only.
    expect(nearer.scrollLeft).toBe(5);
    expect(farther.scrollLeft).toBe(0);
    // Y falls through to the farther candidate, since the nearer one never proposed it.
    expect(nearer.scrollTop).toBe(0);
    expect(farther.scrollTop).toBe(8);
  });

  it('does nothing when the reorder container is disconnected', () => {
    const container = document.createElement('div');
    stubRect(container, { top: 100, bottom: 200, left: 0, right: 50 });

    const candidate = createElement();
    stubRect(candidate, { top: 100, bottom: 150, left: 0, right: 50 });

    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 10 },
    });

    const source = { element: container.appendChild(document.createElement('div')) };
    const manager = { dragOperation: { position: { current: { x: 0, y: 0 } }, source } };

    runReorderAutoscrollFrame(manager, container, [candidate]);

    expect(candidate.scrollTop).toBe(0);
    expect(mockedDetectScrollIntent).not.toHaveBeenCalled();
  });

  it('does nothing when the drag source element is disconnected', () => {
    const container = createElement();
    stubRect(container, { top: 100, bottom: 200, left: 0, right: 50 });

    const candidate = createElement();
    stubRect(candidate, { top: 100, bottom: 150, left: 0, right: 50 });

    mockedDetectScrollIntent.mockReturnValue({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 10 },
    });

    const detachedSourceElement = document.createElement('div');
    const manager = {
      dragOperation: {
        position: { current: { x: 0, y: 0 } },
        source: { element: detachedSourceElement },
      },
    };

    runReorderAutoscrollFrame(manager, container, [candidate]);

    expect(candidate.scrollTop).toBe(0);
    expect(mockedDetectScrollIntent).not.toHaveBeenCalled();
  });
});

describe('ReorderAutoScroller lifecycle', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelSpy: ReturnType<typeof vi.spyOn>;
  let nextFrameId: number;

  beforeEach(() => {
    nextFrameId = 1;
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => nextFrameId++);
    cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  // `actions.start`/`actions.stop` defer their status transition to `manager.renderer.rendering`
  // (a microtask), which is also where the reactive `dragOperation.status` change that drives
  // `registerEffect` actually flushes. Awaiting that same microtask lets the effect settle before
  // assertions run.
  const flushRendering = (manager: DragDropManager) => manager.renderer.rendering;

  const createDraggingManager = async () => {
    const container = createElement();
    const item = createElement(container);
    const manager = new DragDropManager({ plugins: [ReorderAutoScroller] });
    const draggable = new Draggable({ id: 'reorder-item', element: item }, manager);
    manager.registry.register(draggable);

    manager.actions.start({ source: draggable, coordinates: { x: 0, y: 0 } });
    await flushRendering(manager);

    return { manager, container, item };
  };

  it('schedules exactly one pending animation frame at a time', async () => {
    const { manager } = await createDraggingManager();

    expect(rafSpy).toHaveBeenCalledTimes(1);
    const [firstCallback] = rafSpy.mock.calls[0] ?? [];
    expect(typeof firstCallback).toBe('function');

    firstCallback?.(0);
    expect(rafSpy).toHaveBeenCalledTimes(2);

    const [secondCallback] = rafSpy.mock.calls[1] ?? [];
    secondCallback?.(0);
    expect(rafSpy).toHaveBeenCalledTimes(3);

    manager.actions.stop({});
    await flushRendering(manager);
  });

  it('cancels the pending frame when the drag ends', async () => {
    const { manager } = await createDraggingManager();

    expect(rafSpy).toHaveBeenCalledTimes(1);
    const frameId = rafSpy.mock.results[0]?.value;

    manager.actions.stop({});
    await flushRendering(manager);

    expect(cancelSpy).toHaveBeenCalledWith(frameId);
  });

  it('schedules no further frames once the drag has ended', async () => {
    const { manager } = await createDraggingManager();
    const [firstCallback] = rafSpy.mock.calls[0] ?? [];

    manager.actions.stop({});
    await flushRendering(manager);
    rafSpy.mockClear();

    firstCallback?.(0);

    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('schedules no further frames once the plugin instance is destroyed', async () => {
    const { manager } = await createDraggingManager();
    const [firstCallback] = rafSpy.mock.calls[0] ?? [];

    const plugin = manager.registry.plugins.get(ReorderAutoScroller);
    plugin?.destroy();
    rafSpy.mockClear();

    firstCallback?.(0);

    expect(rafSpy).not.toHaveBeenCalled();

    manager.actions.stop({});
    await flushRendering(manager);
  });

  it('cancels the pending animation frame when disabled during an active drag', async () => {
    const { manager } = await createDraggingManager();

    const frameId = rafSpy.mock.results[0]?.value;
    const plugin = manager.registry.plugins.get(ReorderAutoScroller);

    plugin?.disable();

    expect(cancelSpy).toHaveBeenCalledWith(frameId);

    manager.actions.stop({});
    await flushRendering(manager);
  });

  it('does not schedule another frame from a callback captured before disable', async () => {
    const { manager } = await createDraggingManager();
    const [firstCallback] = rafSpy.mock.calls[0] ?? [];

    const plugin = manager.registry.plugins.get(ReorderAutoScroller);
    plugin?.disable();
    rafSpy.mockClear();

    firstCallback?.(0);

    expect(rafSpy).not.toHaveBeenCalled();

    manager.actions.stop({});
    await flushRendering(manager);
  });

  it('starts exactly one new frame when re-enabled while the drag is still active', async () => {
    const { manager } = await createDraggingManager();

    const plugin = manager.registry.plugins.get(ReorderAutoScroller);
    plugin?.disable();
    rafSpy.mockClear();

    plugin?.enable();

    expect(rafSpy).toHaveBeenCalledTimes(1);

    manager.actions.stop({});
    await flushRendering(manager);
  });

  it('never creates concurrent frame loops across repeated enable/disable transitions', async () => {
    const { manager } = await createDraggingManager();

    const plugin = manager.registry.plugins.get(ReorderAutoScroller);
    rafSpy.mockClear();

    for (let iteration = 0; iteration < 3; iteration += 1) {
      plugin?.disable();
      plugin?.enable();
    }

    expect(rafSpy).toHaveBeenCalledTimes(3);
    expect(cancelSpy).toHaveBeenCalledTimes(3);

    const [latestCallback] = rafSpy.mock.calls[rafSpy.mock.calls.length - 1] ?? [];
    rafSpy.mockClear();

    latestCallback?.(0);

    expect(rafSpy).toHaveBeenCalledTimes(1);

    manager.actions.stop({});
    await flushRendering(manager);
  });
});
