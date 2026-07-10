/**
 * Pointer/touch session orchestration: activation gating, the single active
 * `requestAnimationFrame` loop, live reorder callback invocation, autoscroll
 * ticking, and deterministic cancellation/cleanup.
 *
 * Session state is a single non-reactive mutable object; only `draggingKey`
 * (owned by the caller) is Vue-reactive, keeping this module's per-frame work
 * free of reactivity overhead. Controlled-order verification/rollback lives in
 * `orderConsistency.ts`, post-drag click suppression in `clickSuppression.ts`,
 * and autoscroll geometry in `scrollChain.ts` — this module only orchestrates
 * when each of those runs.
 */
import { nextTick, type Ref } from 'vue';
import { createClickSuppression } from './clickSuppression';
import { MOUSE_ACTIVATION_THRESHOLD_PX, TOUCH_MOVEMENT_SLOP_PX } from './constants';
import { getVirtualActiveRect, shouldDisplaceTarget, type Point, type Rect } from './geometry';
import { getEffectiveHitTestPoint, resolveHitTestTarget } from './hitTest';
import {
  canRollback,
  checkOrderConsistency,
  confirmRequestedMove,
  createOrderExpectation,
  deriveMovedSequence,
  sequencesEqual,
  type OrderExpectation,
} from './orderConsistency';
import { resolveActivationTarget, type RegisteredTarget, type ReorderRegistry } from './registry';
import {
  buildScrollChain,
  didAutoscroll,
  getContainerVisibleRect,
  runAutoscrollTick,
  type ScrollChainEntry,
} from './scrollChain';
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
  orderExpectation: OrderExpectation<Key>;
  grabOffset: Point;
  size: { width: number; height: number };
  rawPointer: Point;
  lastFrameTime: number;
  scrollChain: ScrollChainEntry[];
  awaitingCommit: boolean;
  rafId: number | null;
  touchScrollGuard: ((event: TouchEvent) => void) | null;
  contextMenuGuard: ((event: Event) => void) | null;
  selectionGuard: ((event: Event) => void) | null;
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
  const clickSuppression = createClickSuppression();
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

  const onGlobalPointerDown = (event: PointerEvent) => {
    if (!session || event.pointerId === session.pointerId) return;

    // A second pointer anywhere (inside or outside the container) cancels the current session.
    // Stopping propagation here, in the capture phase, prevents this same event from also being
    // seen by the container's own bubble-phase pointerdown handler as a fresh activation attempt.
    event.stopPropagation();
    cancelSession();
  };

  const addSessionListeners = () => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancelEvent);
    window.addEventListener('pointerdown', onGlobalPointerDown, true);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('keydown', onKeyDown);
  };

  const removeSessionListeners = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancelEvent);
    window.removeEventListener('pointerdown', onGlobalPointerDown, true);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('keydown', onKeyDown);
  };

  const onContainerPointerDown = (event: PointerEvent) => {
    // A second pointer is handled globally (capture-phase, see onGlobalPointerDown) before it
    // can reach here; this guard only covers same-tick re-entrancy.
    if (session) return;

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
      orderExpectation: { sequence: [] },
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

    // Validates uniqueness (throws on a consumer contract violation) and snapshots the expected
    // sequence for this session before any capture/listener side effects are installed.
    const orderExpectation = createOrderExpectation(currentKeys);

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
    containerEl.addEventListener('lostpointercapture', onLostPointerCapture);

    const itemRect = itemEl.getBoundingClientRect();

    session.phase = 'active';
    session.initialIndex = initialIndex;
    session.orderExpectation = orderExpectation;
    session.grabOffset = { x: lastPointer.x - itemRect.left, y: lastPointer.y - itemRect.top };
    session.size = { width: itemRect.width, height: itemRect.height };
    session.rawPointer = { ...lastPointer };
    session.lastFrameTime = performance.now();
    session.scrollChain = buildScrollChain(containerEl);
    session.awaitingCommit = false;
    session.touchScrollGuard = touchScrollGuard;
    session.contextMenuGuard = contextMenuGuard;
    session.selectionGuard = selectionGuard;

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

    const autoscrollResult = runAutoscrollTick(s.scrollChain, s.rawPointer, deltaTimeMs);

    // A scroll write must never be followed by a hit-test/geometry read in the same frame; that
    // work resumes next frame, once the post-scroll layout has settled.
    if (didAutoscroll(autoscrollResult)) return;

    if (s.awaitingCommit) return;

    const currentKeys = options.getKeys();

    if (checkOrderConsistency(s.orderExpectation, currentKeys) === 'external-mutation') {
      cancelSession({ skipRollback: true });
      return;
    }

    const activeIndex = currentKeys.indexOf(s.key);

    const containerVisibleRect = getContainerVisibleRect(
      s.scrollChain,
      autoscrollResult.measurement,
    );
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
    const expectedNextSequence = deriveMovedSequence(
      s.orderExpectation.sequence,
      fromIndex,
      toIndex,
    );

    s.awaitingCommit = true;
    options.onReorder({ key: movedKey, fromIndex, toIndex });

    void nextTick(() => {
      if (!session || session.key !== movedKey) return;

      const keysAfter = options.getKeys();

      if (confirmRequestedMove(expectedNextSequence, keysAfter) === 'rejected') {
        // The controlled order doesn't reflect the requested move (rejected, a different change
        // was applied, or the key vanished): cancel safely rather than continue with divergent
        // state or overwrite whatever the consumer actually did.
        cancelSession({ skipRollback: true });
        return;
      }

      session.orderExpectation = { sequence: expectedNextSequence };
      session.awaitingCommit = false;
    });
  };

  const finishSession = () => {
    if (!session || session.phase !== 'active') {
      teardownSession();
      return;
    }

    const { key, initialIndex } = session;
    const finalIndex = options.getKeys().indexOf(key);

    teardownSession();
    options.draggingKey.value = null;
    options.onDragEnd?.({ key, initialIndex, finalIndex, cancelled: false });
  };

  const cancelSession = (cancelOptions: { skipRollback?: boolean } = {}) => {
    if (!session) return;

    if (session.phase === 'pending') {
      teardownSession();
      return;
    }

    const { key, initialIndex, orderExpectation } = session;
    const currentKeys = options.getKeys();
    let finalIndex = currentKeys.indexOf(key);

    if (!cancelOptions.skipRollback && finalIndex !== -1 && finalIndex !== initialIndex) {
      if (canRollback(orderExpectation, currentKeys, key, initialIndex)) {
        const rollbackSequence = deriveMovedSequence(currentKeys, finalIndex, initialIndex);
        options.onReorder({ key, fromIndex: finalIndex, toIndex: initialIndex });

        const keysAfterRollback = options.getKeys();
        finalIndex = sequencesEqual(keysAfterRollback, rollbackSequence)
          ? initialIndex
          : keysAfterRollback.indexOf(key);
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

      // The browser dispatches the resulting `click` after this synchronous teardown runs, for
      // both a normal release and a mid-drag cancellation followed by the eventual release; arm
      // suppression here so it survives long enough to intercept it.
      clickSuppression.arm(s.containerEl);
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
    clickSuppression.disarm();
  };

  return { attachContainer, detachContainer, notifyItemUnmounted, dispose };
};
