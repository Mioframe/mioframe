/**
 * Pointer/touch session orchestration: activation gating, the single active
 * `requestAnimationFrame` loop, live reorder callback invocation, autoscroll ticking, and
 * deterministic cancellation/cleanup.
 *
 * Session state is a single non-reactive mutable object; only `draggingKey` (owned by the caller)
 * is Vue-reactive, keeping this module's per-frame work free of reactivity overhead.
 * Controlled-order verification, rollback, and the pointerup completion decision live in
 * `orderConsistency.ts`; post-drag click suppression and early-cancellation release tracking live
 * in `clickSuppression.ts`; temporary window/document listeners and second-pointer exclusion live
 * in `sessionGlobalListeners.ts`; autoscroll geometry lives in `scrollChain.ts`. This module only
 * orchestrates session state transitions and decides when each of those runs.
 */
import { nextTick, type Ref } from 'vue';
import { acquireActiveSessionEffects, type ActiveSessionEffects } from './activeSessionEffects';
import { createClickSuppression } from './clickSuppression';
import { MOUSE_ACTIVATION_THRESHOLD_PX, TOUCH_MOVEMENT_SLOP_PX } from './constants';
import { getVirtualActiveRect, shouldDisplaceTarget, type Point, type Rect } from './geometry';
import { getEffectiveHitTestPoint, resolveHitTestTarget } from './hitTest';
import {
  assertUniqueKeys,
  canRollback,
  checkOrderConsistency,
  decidePointerUpOutcome,
  deriveMovedSequence,
  evaluateRequestedMove,
  sequencesEqual,
} from './orderConsistency';
import { resolveActivationTarget, type RegisteredTarget, type ReorderRegistry } from './registry';
import {
  buildScrollChain,
  didAutoscroll,
  getContainerVisibleRect,
  runAutoscrollTick,
  type ScrollChainEntry,
} from './scrollChain';
import { createSessionGlobalListeners } from './sessionGlobalListeners';
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
  /** The last controlled sequence this session confirmed the consumer actually adopted. */
  confirmedSequence: Key[];
  /** A reorder request currently being synchronously validated, or `null` when none is in flight. */
  pendingRequestedSequence: Key[] | null;
  /** Whether the last accepted move is still waiting for Vue's `nextTick` to confirm DOM commit. */
  awaitingDomCommit: boolean;
  /** Whether the original pointer was released while `awaitingDomCommit` was still `true`. */
  finishRequested: boolean;
  /** Whether the original pointer's physical release has already been observed. */
  pointerReleased: boolean;
  grabOffset: Point;
  size: { width: number; height: number };
  rawPointer: Point;
  lastFrameTime: number;
  scrollChain: ScrollChainEntry[];
  rafId: number | null;
  /** The active session's pointer-capture/guard DOM side effects, `null` until activation. */
  activeEffects: ActiveSessionEffects | null;
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

    // Arm suppression immediately, inside the original pointerup handling, regardless of how
    // reconciliation below concludes: the browser's synthetic click follows this same physical
    // release shortly after, so suppression must not wait for the finish/defer/cancel decision.
    session.pointerReleased = true;
    clickSuppression.arm(session.containerEl);

    reconcilePointerUp();
  };

  const reconcilePointerUp = () => {
    if (!session) return;
    const s = session;

    const outcome = decidePointerUpOutcome({
      confirmedSequence: s.confirmedSequence,
      currentKeys: options.getKeys(),
      pendingRequestedSequence: s.pendingRequestedSequence,
      awaitingDomCommit: s.awaitingDomCommit,
    });

    if (outcome === 'cancel') {
      cancelSession({ skipRollback: true });
      return;
    }

    if (outcome === 'defer') {
      s.finishRequested = true;
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

  const onSecondPointerDown = (event: PointerEvent) => {
    if (!session || event.pointerId === session.pointerId) return;
    cancelSession();
  };

  const globalListeners = createSessionGlobalListeners({
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerCancelEvent,
    onSecondPointerDown,
    onWindowBlur,
    onVisibilityChange,
    onEscapeKeyDown: () => {
      cancelSession();
    },
  });

  const onContainerPointerDown = (event: PointerEvent) => {
    // A second pointer is handled globally (capture-phase, see sessionGlobalListeners) before it
    // can reach here; isSecondPointerEvent covers same-dispatch re-entrancy once that handler has
    // already cancelled any prior session synchronously.
    if (session) return;
    if (globalListeners.isSecondPointerEvent(event)) return;

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

    // Validate the controlled-key contract before any pending session, timer, or listener is
    // created: a duplicate-key violation must throw here and leave nothing behind.
    const currentKeys = options.getKeys();
    assertUniqueKeys(currentKeys);
    if (currentKeys.indexOf(target.key) === -1) return;

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
      confirmedSequence: [],
      pendingRequestedSequence: null,
      awaitingDomCommit: false,
      finishRequested: false,
      pointerReleased: false,
      grabOffset: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      rawPointer: point,
      lastFrameTime: 0,
      scrollChain: [],
      rafId: null,
      activeEffects: null,
    };

    globalListeners.attach();

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

    // Re-validated at commit time, using freshly read keys: the controlled data may have changed
    // during the pending phase (mouse threshold delay or touch long-press delay).
    assertUniqueKeys(currentKeys);
    const initialIndex = currentKeys.indexOf(key);

    if (initialIndex === -1) {
      teardownSession();
      return;
    }

    const activeEffects = acquireActiveSessionEffects(
      containerEl,
      pointerId,
      pointerType,
      onLostPointerCapture,
    );

    if (!activeEffects) {
      // Pointer already released or invalid; do not start a captureless drag.
      teardownSession();
      return;
    }

    const itemRect = itemEl.getBoundingClientRect();

    session.phase = 'active';
    session.initialIndex = initialIndex;
    session.confirmedSequence = [...currentKeys];
    session.pendingRequestedSequence = null;
    session.awaitingDomCommit = false;
    session.finishRequested = false;
    session.pointerReleased = false;
    session.grabOffset = { x: lastPointer.x - itemRect.left, y: lastPointer.y - itemRect.top };
    session.size = { width: itemRect.width, height: itemRect.height };
    session.rawPointer = { ...lastPointer };
    session.lastFrameTime = performance.now();
    session.scrollChain = buildScrollChain(containerEl);
    session.activeEffects = activeEffects;

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

    const currentKeys = options.getKeys();

    // The controlled-order check and the awaitingDomCommit gate both run before any autoscroll
    // write, so an incompatible external mutation is always caught before a scroll side effect.
    if (checkOrderConsistency(s.confirmedSequence, currentKeys) === 'external-mutation') {
      cancelSession({ skipRollback: true });
      return;
    }

    if (s.awaitingDomCommit) return;

    const autoscrollResult = runAutoscrollTick(s.scrollChain, s.rawPointer, deltaTimeMs);

    // A scroll write must never be followed by a hit-test/geometry read in the same frame; that
    // work resumes next frame, once the post-scroll layout has settled.
    if (didAutoscroll(autoscrollResult)) return;

    const activeIndex = currentKeys.indexOf(s.key);

    const containerVisibleRect = getContainerVisibleRect(autoscrollResult.measurement);
    const effectivePoint = getEffectiveHitTestPoint(containerVisibleRect, s.rawPointer);
    const target = resolveHitTestTarget(registry, s.containerEl, effectivePoint, s.key);
    if (!target) return;

    const targetIndex = currentKeys.indexOf(target.key);
    if (targetIndex === -1) return;

    const virtualRect = getVirtualActiveRect(s.rawPointer, s.grabOffset, s.size);
    const activeFlowRect = domRectToRect(s.itemEl.getBoundingClientRect());
    const targetRect = domRectToRect(target.element.getBoundingClientRect());

    if (!shouldDisplaceTarget(virtualRect, activeFlowRect, targetRect)) return;

    requestMove(s, activeIndex, targetIndex);
  };

  const requestMove = (s: SessionState<Key>, fromIndex: number, toIndex: number) => {
    const movedKey = s.key;
    const requestedSequence = deriveMovedSequence(s.confirmedSequence, fromIndex, toIndex);

    s.pendingRequestedSequence = requestedSequence;
    options.onReorder({ key: movedKey, fromIndex, toIndex });

    const outcome = evaluateRequestedMove(requestedSequence, options.getKeys());
    s.pendingRequestedSequence = null;

    if (outcome.kind === 'rejected') {
      // The controlled order doesn't reflect the requested move (rejected, a different change
      // was applied, or the key vanished): cancel safely rather than continue with divergent
      // state or overwrite whatever the consumer actually did.
      cancelSession({ skipRollback: true });
      return;
    }

    // Promoted synchronously: an immediate cancellation right after this can already roll back
    // from the up-to-date confirmedSequence, without waiting for nextTick.
    s.confirmedSequence = outcome.confirmedSequence;
    s.awaitingDomCommit = true;

    void nextTick(() => {
      if (session !== s) return;

      if (checkOrderConsistency(s.confirmedSequence, options.getKeys()) === 'external-mutation') {
        cancelSession({ skipRollback: true });
        return;
      }

      s.awaitingDomCommit = false;

      // The next scheduled animation frame naturally remeasures now that the gate is clear.
      if (s.finishRequested) finishSession();
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

    const { key, initialIndex, confirmedSequence, pendingRequestedSequence } = session;
    const currentKeys = options.getKeys();
    let finalIndex = currentKeys.indexOf(key);

    const rollbackAllowed =
      !cancelOptions.skipRollback &&
      pendingRequestedSequence === null &&
      finalIndex !== -1 &&
      finalIndex !== initialIndex &&
      canRollback(confirmedSequence, currentKeys, key, initialIndex);

    if (rollbackAllowed) {
      const rollbackSequence = deriveMovedSequence(currentKeys, finalIndex, initialIndex);
      options.onReorder({ key, fromIndex: finalIndex, toIndex: initialIndex });

      const keysAfterRollback = options.getKeys();
      finalIndex = sequencesEqual(keysAfterRollback, rollbackSequence)
        ? initialIndex
        : keysAfterRollback.indexOf(key);
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

    globalListeners.detach();

    if (s.phase === 'active') {
      s.activeEffects?.dispose();

      // If the physical release hasn't happened yet (Escape, blur, visibility loss, a second
      // pointer, container removal, unmount, or lost capture), track it instead of arming a
      // zero-delay fallback that would expire long before the pointer actually lifts. A normal
      // release already armed suppression immediately inside the pointerup handling itself.
      if (!s.pointerReleased) {
        clickSuppression.armReleaseWatcher({ containerEl: s.containerEl, pointerId: s.pointerId });
      }
    }
  };

  const attachContainer = (containerEl: HTMLElement) => {
    containerEl.addEventListener('pointerdown', onContainerPointerDown);
  };

  const detachContainer = (containerEl: HTMLElement) => {
    containerEl.removeEventListener('pointerdown', onContainerPointerDown);
    if (session && session.containerEl === containerEl) cancelSession();
    clickSuppression.disarm();
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
