/**
 * Pointer/touch session orchestration: activation gating, the single active
 * `requestAnimationFrame` loop, live reorder callback invocation, autoscroll
 * ticking, and deterministic cancellation/cleanup.
 *
 * Session state is a single non-reactive mutable object; only `draggingKey`
 * (owned by the caller) is Vue-reactive, keeping this module's per-frame work
 * free of reactivity overhead.
 */
import { nextTick, type Ref } from 'vue';
import { MOUSE_ACTIVATION_THRESHOLD_PX, TOUCH_MOVEMENT_SLOP_PX } from './constants';
import { getVirtualActiveRect, shouldDisplaceTarget, type Point, type Rect } from './geometry';
import { getEffectiveHitTestPoint, resolveHitTestTarget } from './hitTest';
import { resolveActivationTarget, type RegisteredTarget, type ReorderRegistry } from './registry';
import { buildScrollChain, getVisibleClientRect, runAutoscrollTick } from './scrollChain';
import type {
  ReorderDragEndEvent,
  ReorderDragStartEvent,
  ReorderKey,
  ReorderMoveEvent,
} from './types';

interface SessionState<Key extends ReorderKey> {
  phase: 'pending' | 'active';
  pointerId: number;
  pointerType: 'mouse' | 'touch';
  key: Key;
  itemEl: HTMLElement;
  containerEl: HTMLElement;
  startPointer: Point;
  lastPointer: Point;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  initialIndex: number;
  currentIndex: number;
  grabOffset: Point;
  size: { width: number; height: number };
  rawPointer: Point;
  lastFrameTime: number;
  scrollChain: Element[];
  awaitingCommit: boolean;
  rafId: number | null;
  touchScrollGuard: ((event: TouchEvent) => void) | null;
  contextMenuGuard: ((event: Event) => void) | null;
  selectionGuard: ((event: Event) => void) | null;
  clickSuppressor: ((event: MouseEvent) => void) | null;
}

const domRectToRect = (domRect: DOMRect): Rect => ({
  left: domRect.left,
  top: domRect.top,
  width: domRect.width,
  height: domRect.height,
});

/** Options for {@link createPointerSession}. */
export interface CreatePointerSessionOptions<Key extends ReorderKey> {
  /** The shared per-`useReorder`-instance registration store. */
  registry: ReorderRegistry<Key>;
  /** Reads the current consumer-owned ordered keys. */
  getKeys: () => readonly Key[];
  /** Reads the current configured long-press delay, in milliseconds. */
  getLongPressDelay: () => number;
  /** The public reactive dragging-key ref this session writes to. */
  draggingKey: Ref<Key | null>;
  /** Invoked for every live move; see `useReorder`'s `onReorder` contract. */
  onReorder: (event: ReorderMoveEvent<Key>) => void;
  /** Invoked once per activated session; see `useReorder`'s `onDragStart` contract. */
  onDragStart?: ((event: ReorderDragStartEvent<Key>) => void) | undefined;
  /** Invoked once per activated session; see `useReorder`'s `onDragEnd` contract. */
  onDragEnd?: ((event: ReorderDragEndEvent<Key>) => void) | undefined;
}

/** The imperative session controller returned by {@link createPointerSession}. */
export interface PointerSession<Key extends ReorderKey> {
  /** Starts listening for activation gestures on the registered reorder container. */
  attachContainer: (containerEl: HTMLElement) => void;
  /** Stops listening on `containerEl` and safely cancels any session it owns. */
  detachContainer: (containerEl: HTMLElement) => void;
  /** Safely cancels the active session if it belongs to `key` (the item unmounted). */
  notifyItemUnmounted: (key: Key) => void;
  /** Cancels any in-flight session and releases every listener; call on scope dispose. */
  dispose: () => void;
}

/**
 * Creates one pointer/touch drag session controller for a single `useReorder` instance.
 * @param options - The session's registry, data source, and callback wiring.
 * @returns The imperative controller used by the reorder directives.
 */
export const createPointerSession = <Key extends ReorderKey>(
  options: CreatePointerSessionOptions<Key>,
): PointerSession<Key> => {
  const { registry } = options;
  let session: SessionState<Key> | null = null;

  const onPointerMove = (event: PointerEvent) => {
    if (!session || event.pointerId !== session.pointerId) return;

    const point: Point = { x: event.clientX, y: event.clientY };
    session.lastPointer = point;

    if (session.phase === 'pending') {
      const distance = Math.hypot(
        point.x - session.startPointer.x,
        point.y - session.startPointer.y,
      );

      if (session.pointerType === 'mouse') {
        if (distance >= MOUSE_ACTIVATION_THRESHOLD_PX) activateSession();
      } else if (distance >= TOUCH_MOVEMENT_SLOP_PX) {
        // Movement beyond slop before the long-press timer fires cancels the pending
        // gesture silently: it never activated, so no callback fires.
        teardownSession();
      }

      return;
    }

    session.rawPointer = point;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!session || event.pointerId !== session.pointerId) return;

    if (session.phase === 'pending') {
      // Released before activation: a normal click, no callbacks fire.
      teardownSession();
      return;
    }

    finishSession();
  };

  const onPointerCancelEvent = (event: PointerEvent) => {
    if (session && event.pointerId === session.pointerId) cancelSession();
  };

  const onLostPointerCapture = (event: PointerEvent) => {
    if (session && session.phase === 'active' && event.pointerId === session.pointerId) {
      cancelSession();
    }
  };

  const onWindowBlur = () => {
    cancelSession();
  };

  const onVisibilityChange = () => {
    if (document.hidden) cancelSession();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') cancelSession();
  };

  const addSessionListeners = () => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancelEvent);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('keydown', onKeyDown);
  };

  const removeSessionListeners = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancelEvent);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('keydown', onKeyDown);
  };

  const onContainerPointerDown = (event: PointerEvent) => {
    if (session) {
      // A second pointer cancels whatever session (pending or active) is already running.
      if (event.pointerId !== session.pointerId) cancelSession();
      return;
    }

    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const containerEl = registry.containerEl;
    if (!containerEl) return;

    const target = resolveActivationTarget(
      registry,
      containerEl,
      event.target instanceof Node ? event.target : null,
    );
    if (!target) return;

    startPendingSession(event, target, containerEl);
  };

  const startPendingSession = (
    event: PointerEvent,
    target: RegisteredTarget<Key>,
    containerEl: HTMLElement,
  ) => {
    const pointerType: 'mouse' | 'touch' = event.pointerType === 'touch' ? 'touch' : 'mouse';
    const point: Point = { x: event.clientX, y: event.clientY };

    session = {
      phase: 'pending',
      pointerId: event.pointerId,
      pointerType,
      key: target.key,
      itemEl: target.element,
      containerEl,
      startPointer: point,
      lastPointer: point,
      longPressTimer: null,
      initialIndex: -1,
      currentIndex: -1,
      grabOffset: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      rawPointer: point,
      lastFrameTime: 0,
      scrollChain: [],
      awaitingCommit: false,
      rafId: null,
      touchScrollGuard: null,
      contextMenuGuard: null,
      selectionGuard: null,
      clickSuppressor: null,
    };

    addSessionListeners();

    if (pointerType === 'touch') {
      session.longPressTimer = setTimeout(() => {
        activateSession();
      }, options.getLongPressDelay());
    }
  };

  const activateSession = () => {
    if (!session || session.phase !== 'pending') return;

    if (session.longPressTimer !== null) {
      clearTimeout(session.longPressTimer);
      session.longPressTimer = null;
    }

    const { containerEl, itemEl, pointerId, pointerType, key, lastPointer } = session;
    const currentKeys = options.getKeys();
    const initialIndex = currentKeys.indexOf(key);

    if (initialIndex === -1) {
      teardownSession();
      return;
    }

    try {
      containerEl.setPointerCapture(pointerId);
    } catch {
      // Pointer already released or invalid; do not start a captureless drag.
      teardownSession();
      return;
    }

    let touchScrollGuard: ((event: TouchEvent) => void) | null = null;
    let contextMenuGuard: ((event: Event) => void) | null = null;

    if (pointerType === 'touch') {
      touchScrollGuard = (event: TouchEvent) => {
        event.preventDefault();
      };
      containerEl.addEventListener('touchmove', touchScrollGuard, { passive: false });
      contextMenuGuard = (event: Event) => {
        event.preventDefault();
      };
      containerEl.addEventListener('contextmenu', contextMenuGuard);
    }

    const selectionGuard = (event: Event) => {
      event.preventDefault();
    };
    document.addEventListener('selectstart', selectionGuard);

    const clickSuppressor = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      containerEl.removeEventListener('click', clickSuppressor, true);
    };
    containerEl.addEventListener('click', clickSuppressor, true);
    containerEl.addEventListener('lostpointercapture', onLostPointerCapture);

    const itemRect = itemEl.getBoundingClientRect();

    session.phase = 'active';
    session.initialIndex = initialIndex;
    session.currentIndex = initialIndex;
    session.grabOffset = { x: lastPointer.x - itemRect.left, y: lastPointer.y - itemRect.top };
    session.size = { width: itemRect.width, height: itemRect.height };
    session.rawPointer = { ...lastPointer };
    session.lastFrameTime = performance.now();
    session.scrollChain = buildScrollChain(containerEl);
    session.awaitingCommit = false;
    session.touchScrollGuard = touchScrollGuard;
    session.contextMenuGuard = contextMenuGuard;
    session.selectionGuard = selectionGuard;
    session.clickSuppressor = clickSuppressor;

    options.draggingKey.value = key;
    options.onDragStart?.({ key, index: initialIndex });

    scheduleFrame();
  };

  const scheduleFrame = () => {
    if (!session) return;
    session.rafId = requestAnimationFrame(tick);
  };

  const tick = (time: number) => {
    if (!session || session.phase !== 'active') return;

    const deltaTimeMs = time - session.lastFrameTime;
    session.lastFrameTime = time;

    processActiveFrame(deltaTimeMs);

    // scheduleFrame() re-checks for a live session itself: processActiveFrame may have
    // ended the session synchronously (e.g. the active key disappeared).
    scheduleFrame();
  };

  const processActiveFrame = (deltaTimeMs: number) => {
    if (!session) return;
    const s = session;

    runAutoscrollTick(s.scrollChain, s.rawPointer, deltaTimeMs);

    if (s.awaitingCommit) return;

    const currentKeys = options.getKeys();
    const activeIndex = currentKeys.indexOf(s.key);

    if (activeIndex === -1) {
      cancelSession({ skipRollback: true });
      return;
    }

    const containerVisibleRect = getVisibleClientRect(s.containerEl, s.scrollChain.slice(1));
    const effectivePoint = getEffectiveHitTestPoint(containerVisibleRect, s.rawPointer);
    const target = resolveHitTestTarget(registry, s.containerEl, effectivePoint, s.key);
    if (!target) return;

    const targetIndex = currentKeys.indexOf(target.key);
    if (targetIndex === -1) return;

    const virtualRect = getVirtualActiveRect(s.rawPointer, s.grabOffset, s.size);
    const activeFlowRect = domRectToRect(s.itemEl.getBoundingClientRect());
    const targetRect = domRectToRect(target.element.getBoundingClientRect());

    if (!shouldDisplaceTarget(virtualRect, activeFlowRect, targetRect)) return;

    const movedKey = s.key;
    const fromIndex = activeIndex;
    const toIndex = targetIndex;

    s.awaitingCommit = true;
    s.currentIndex = toIndex;
    options.onReorder({ key: movedKey, fromIndex, toIndex });

    void nextTick(() => {
      if (!session || session.key !== movedKey) return;

      const keysAfter = options.getKeys();
      const activeIndexAfter = keysAfter.indexOf(movedKey);

      if (activeIndexAfter === -1 || activeIndexAfter !== toIndex) {
        // The controlled order doesn't reflect the requested move (or the key vanished):
        // cancel safely rather than continue with divergent state.
        cancelSession({ skipRollback: true });
        return;
      }

      session.currentIndex = activeIndexAfter;
      session.awaitingCommit = false;
    });
  };

  const finishSession = () => {
    if (!session || session.phase !== 'active') {
      teardownSession();
      return;
    }

    const { key, initialIndex, currentIndex } = session;
    teardownSession();
    options.draggingKey.value = null;
    options.onDragEnd?.({ key, initialIndex, finalIndex: currentIndex, cancelled: false });
  };

  const cancelSession = (cancelOptions: { skipRollback?: boolean } = {}) => {
    if (!session) return;

    if (session.phase === 'pending') {
      teardownSession();
      return;
    }

    const { key, initialIndex, currentIndex } = session;
    let finalIndex = currentIndex;

    if (!cancelOptions.skipRollback) {
      const currentKeys = options.getKeys();
      const activeIndex = currentKeys.indexOf(key);

      if (activeIndex !== -1) {
        if (activeIndex !== initialIndex) {
          options.onReorder({ key, fromIndex: activeIndex, toIndex: initialIndex });
        }
        finalIndex = initialIndex;
      }
    }

    teardownSession();
    options.draggingKey.value = null;
    options.onDragEnd?.({ key, initialIndex, finalIndex, cancelled: true });
  };

  const teardownSession = () => {
    if (!session) return;
    const s = session;
    session = null;

    if (s.longPressTimer !== null) clearTimeout(s.longPressTimer);
    if (s.rafId !== null) cancelAnimationFrame(s.rafId);

    removeSessionListeners();

    if (s.phase === 'active') {
      if (s.containerEl.hasPointerCapture(s.pointerId)) {
        try {
          s.containerEl.releasePointerCapture(s.pointerId);
        } catch {
          // Capture already released by the browser.
        }
      }

      s.containerEl.removeEventListener('lostpointercapture', onLostPointerCapture);
      if (s.touchScrollGuard) s.containerEl.removeEventListener('touchmove', s.touchScrollGuard);
      if (s.contextMenuGuard) s.containerEl.removeEventListener('contextmenu', s.contextMenuGuard);
      if (s.selectionGuard) document.removeEventListener('selectstart', s.selectionGuard);
      if (s.clickSuppressor) s.containerEl.removeEventListener('click', s.clickSuppressor, true);
    }
  };

  const attachContainer = (containerEl: HTMLElement) => {
    containerEl.addEventListener('pointerdown', onContainerPointerDown);
  };

  const detachContainer = (containerEl: HTMLElement) => {
    containerEl.removeEventListener('pointerdown', onContainerPointerDown);
    if (session && session.containerEl === containerEl) cancelSession();
  };

  const notifyItemUnmounted = (key: Key) => {
    if (session && session.key === key) cancelSession({ skipRollback: true });
  };

  const dispose = () => {
    cancelSession();
  };

  return { attachContainer, detachContainer, notifyItemUnmounted, dispose };
};
