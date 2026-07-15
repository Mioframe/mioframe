import { Draggable } from '@dnd-kit/dom';
import { DragDropManager } from '@dnd-kit/dom';
import { canScroll, detectScrollIntent, ScrollDirection } from '@dnd-kit/dom/utilities';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReorderAutoScroller, runReorderAutoscrollFrame } from './ReorderAutoScroller';

vi.mock('@dnd-kit/dom/utilities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/dom/utilities')>();
  return {
    ...actual,
    detectScrollIntent: vi.fn(),
    canScroll: vi.fn(),
  };
});

const mockedDetectScrollIntent = vi.mocked(detectScrollIntent);
const mockedCanScroll = vi.mocked(canScroll);

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
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('runReorderAutoscrollFrame', () => {
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
});
