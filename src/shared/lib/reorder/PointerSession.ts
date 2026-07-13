/**
 * Pointer/touch session orchestration: activation gating, the single active
 * `requestAnimationFrame` loop, live reorder callback invocation, autoscroll ticking, and
 * deterministic cancellation/cleanup.
 *
 * Session state is one of three explicit, non-reactive phases — `PendingSession` (activation
 * gating), `DraggingSession` (the physically active gesture), or `SettlingSession` (an accepted
 * move still waiting for Vue's DOM commit after the pointer has already been physically released)
 * — represented as a local discriminated union so each phase only carries the resources it can
 * actually own; "ended" is `session === null`, not a stored phase. Only `draggingKey` (owned by
 * the caller) is Vue-reactive, keeping this module's per-frame work free of reactivity overhead.
 * Controlled-order verification, rollback, and the pointerup completion decision live in
 * `orderConsistency.ts`; post-drag click suppression and early-cancellation release tracking live
 * in `clickSuppression.ts`; temporary window/document listeners and second-pointer exclusion live
 * in `sessionGlobalListeners.ts`; autoscroll geometry lives in `scrollChain.ts`. This module only
 * orchestrates session state transitions and decides when each of those runs.
 *
 * Every call into consumer-owned `keys`, `onDragStart`, or `onReorder` is guarded by
 * {@link callConsumer}: on a thrown error it deterministically aborts the current session via
 * {@link abortSessionOnConsumerError} — the same hard cleanup `detachContainer`/`dispose` use —
 * before rethrowing the original error unchanged, without rollback and without calling
 * `onDragEnd`. See the module README's "Consumer exceptions" section for the full contract.
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

/**
 * Identifies exactly one accepted, not-yet-DOM-committed live move. Created fresh for every
 * accepted move and cleared once its `nextTick` resolves; a later `nextTick` callback whose token
 * no longer matches the current session's token belongs to a stale or superseded move and is a
 * no-op.
 */
type CommitToken = symbol;

/** How the original pointer stream has physically ended so far, for a `DraggingSession`. */
type TerminationReason = 'released' | 'cancelled' | 'not-ended';

/** Activation-gating phase: a candidate gesture that has not yet crossed the activation bar. */
interface PendingSession<Key extends ReorderKey> {
  phase: 'pending';
  pointerId: number;
  pointerType: 'mouse' | 'touch';
  key: Key;
  itemEl: HTMLElement;
  containerEl: HTMLElement;
  startPointer: Point;
  lastPointer: Point;
  longPressTimer: ReturnType<typeof setTimeout> | null;
}

/** The physically active drag: pointer capture is held and the per-frame loop is running. */
interface DraggingSession<Key extends ReorderKey> {
  phase: 'dragging';
  pointerId: number;
  pointerType: 'mouse' | 'touch';
  key: Key;
  itemEl: HTMLElement;
  containerEl: HTMLElement;
  initialIndex: number;
  /** The full controlled sequence captured when the session activated. */
  initialSequence: Key[];
  /** The last controlled sequence this session confirmed the consumer actually adopted. */
  confirmedSequence: Key[];
  /** A reorder request currently being synchronously validated, or `null` when none is in flight. */
  pendingRequestedSequence: Key[] | null;
  /**
   * See {@link TerminationReason}. `'released'` and `'cancelled'` are terminal: the browser has
   * already ended the stream, so no release watcher is needed and (for `'cancelled'`) no click can
   * ever follow. `'not-ended'` means the stream may still be physically live even though the
   * session itself is tearing down for another reason (Escape, blur, visibility loss, a second
   * pointer, active-item/container removal, or unexpected lost capture) — only that case needs a
   * bounded release watcher.
   */
  terminationReason: TerminationReason;
  grabOffset: Point;
  size: { width: number; height: number };
  rawPointer: Point;
  lastFrameTime: number;
  scrollChain: ScrollChainEntry[];
  rafId: number | null;
  /** The active session's pointer-capture/guard DOM side effects; `null` once stopped. */
  activeEffects: ActiveSessionEffects | null;
  /** The current accepted move's awaited `nextTick` token, or `null` when none is in flight. */
  commitToken: CommitToken | null;
}

/**
 * Exists only after physical `pointerup`, when the last accepted controlled move is still waiting
 * for Vue's DOM commit. Owns nothing pointer-runtime-related: capture, listeners, rAF, scroll
 * chain, and guards were already stopped before this phase began.
 */
interface SettlingSession<Key extends ReorderKey> {
  phase: 'settling';
  key: Key;
  initialIndex: number;
  initialSequence: Key[];
  confirmedSequence: Key[];
  /** The single move this settling session is waiting to see committed to the DOM. */
  commitToken: CommitToken;
}

type SessionState<Key extends ReorderKey> =
  | PendingSession<Key>
  | DraggingSession<Key>
  | SettlingSession<Key>;

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

/**
 * The imperative session controller returned by {@link createPointerSession}.
 *
 * `detachContainer` and `dispose` are both hard cleanup boundaries: library ownership ends
 * immediately and unconditionally, not only when the pointer eventually releases. Both cancel any
 * in-flight session (any phase) inside a `try` and then unconditionally disarm click suppression in
 * a matching `finally` — which removes a pending bounded release watcher and its safety timeout,
 * even though cancelling a still-physically-held dragging session would otherwise start exactly
 * that watcher (see `clickSuppression.ts`), and even though cancellation itself can throw: any of
 * the consumer-owned `getKeys`/`onReorder`/`onDragEnd` calls it makes (cancellation-time key
 * re-validation, rollback, or the final callback) are outside the library's trust boundary. The
 * `finally` guarantees the disarm still runs and the original error still propagates unchanged. The
 * watcher is only ever observable across an *earlier* cancellation that leaves the composable and
 * its container still mounted (for example {@link notifyItemUnmounted} alone, without a following
 * `detachContainer`); it cannot outlive a `detachContainer`/`dispose` call itself, since the disarm
 * happens unconditionally right after, success or throw.
 */
export interface PointerSession<Key extends ReorderKey> {
  /** Starts listening for activation gestures on the registered reorder container. */
  attachContainer: (containerEl: HTMLElement) => void;
  /**
   * Stops listening on `containerEl` and hard-cancels any session it owns: the active session
   * runtime (rAF, capture, listeners, guards), click suppression, and any pending release
   * watcher and its safety timeout are all removed immediately. See the interface-level doc
   * comment.
   */
  detachContainer: (containerEl: HTMLElement) => void;
  /** Safely cancels the active session if it belongs to `key` (the item unmounted). */
  notifyItemUnmounted: (key: Key) => void;
  /**
   * Hard-cancels any in-flight session and releases every listener, exactly like
   * `detachContainer`; call on scope dispose. See the interface-level doc comment.
   */
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
    // A settling session owns no pointer identity to match: its global listeners are already
    // detached, so this branch is structurally unreachable for it, but the guard keeps the
    // narrowing below sound.
    if (!session || session.phase === 'settling' || event.pointerId !== session.pointerId) return;

    const point: Point = { x: event.clientX, y: event.clientY };

    if (session.phase === 'pending') {
      session.lastPointer = point;

      const distance = Math.hypot(
        point.x - session.startPointer.x,
        point.y - session.startPointer.y,
      );

      if (session.pointerType === 'mouse') {
        if (distance >= MOUSE_ACTIVATION_THRESHOLD_PX) activateSession();
      } else if (distance >= TOUCH_MOVEMENT_SLOP_PX) {
        // Movement beyond slop before the long-press timer fires cancels the pending
        // gesture silently: it never activated, so no callback fires.
        teardownPendingSession(session);
      }

      return;
    }

    session.rawPointer = point;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!session || session.phase === 'settling' || event.pointerId !== session.pointerId) return;

    if (session.phase === 'pending') {
      // Released before activation: a normal click, no callbacks fire.
      teardownPendingSession(session);
      return;
    }

    const s = session;

    // Arm suppression immediately, inside the original pointerup handling, regardless of how
    // reconciliation below concludes: the browser's synthetic click follows this same physical
    // release shortly after, so suppression must not wait for the finish/defer/cancel decision.
    s.terminationReason = 'released';
    clickSuppression.arm(s.containerEl);

    // The physical release ends the interactive part of the gesture even when completion itself
    // must defer until Vue's DOM commit: stop the rAF loop, global listeners, pointer capture, and
    // touch/context-menu/selection guards right now so nothing keeps running (and so an expected
    // `lostpointercapture` from the capture release below can no longer reach a listener that
    // would otherwise cancel the deferred completion).
    stopGestureRuntime(s);

    reconcilePointerUp(s);
  };

  const reconcilePointerUp = (s: DraggingSession<Key>) => {
    const currentKeys = callConsumer(() => options.getKeys());

    const outcome = decidePointerUpOutcome({
      confirmedSequence: s.confirmedSequence,
      currentKeys,
      pendingRequestedSequence: s.pendingRequestedSequence,
      awaitingDomCommit: s.commitToken !== null,
    });

    if (outcome === 'cancel') {
      cancelSession({ skipRollback: true });
      return;
    }

    if (outcome === 'defer') {
      const commitToken = s.commitToken;
      // decidePointerUpOutcome only returns 'defer' when a commit token is currently awaited.
      if (commitToken === null) return;

      session = {
        phase: 'settling',
        key: s.key,
        initialIndex: s.initialIndex,
        initialSequence: s.initialSequence,
        confirmedSequence: s.confirmedSequence,
        commitToken,
      };
      return;
    }

    finishDraggingSession(s);
  };

  const onPointerCancelEvent = (event: PointerEvent) => {
    if (!session || session.phase === 'settling' || event.pointerId !== session.pointerId) return;

    // A direct `pointercancel` ends the original pointer stream completely: no click can ever
    // follow it, so no release watcher may be created for it (armReleaseWatcher is installed too
    // late to observe a `pointercancel` that already happened).
    if (session.phase === 'dragging') session.terminationReason = 'cancelled';
    cancelSession();
  };

  const onLostPointerCapture = (event: PointerEvent) => {
    if (
      session &&
      session.phase === 'dragging' &&
      event.pointerId === session.pointerId &&
      session.terminationReason === 'not-ended'
    ) {
      // Only cancel while the original pointer stream is still genuinely live. Once `pointerup`
      // or `pointercancel` has already been processed, a later `lostpointercapture` is expected
      // (the browser releasing capture as part of that same termination) and must not turn an
      // already-decided outcome into a cancellation.
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
    if (!session || session.phase === 'settling' || event.pointerId === session.pointerId) return;
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
    const pending = session;

    if (pending.longPressTimer !== null) {
      clearTimeout(pending.longPressTimer);
      pending.longPressTimer = null;
    }

    const { containerEl, itemEl, pointerId, pointerType, key, lastPointer } = pending;

    // Re-validated at commit time, using freshly read keys: the controlled data may have changed
    // during the pending phase (mouse threshold delay or touch long-press delay). Still in the
    // 'pending' phase here, so a thrown validation failure is a programmer/data-contract error
    // before any drag callback fires, not a completed drag gesture: teardownPendingSession()
    // naturally skips every click-suppression/release-watcher side effect for a pending session.
    let currentKeys: readonly Key[];
    try {
      currentKeys = options.getKeys();
      assertUniqueKeys(currentKeys);
    } catch (error) {
      teardownPendingSession(pending);
      throw error;
    }

    const initialIndex = currentKeys.indexOf(key);

    if (initialIndex === -1) {
      teardownPendingSession(pending);
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
      teardownPendingSession(pending);
      return;
    }

    const itemRect = itemEl.getBoundingClientRect();

    session = {
      phase: 'dragging',
      pointerId,
      pointerType,
      key,
      itemEl,
      containerEl,
      initialIndex,
      initialSequence: [...currentKeys],
      confirmedSequence: [...currentKeys],
      pendingRequestedSequence: null,
      terminationReason: 'not-ended',
      grabOffset: { x: lastPointer.x - itemRect.left, y: lastPointer.y - itemRect.top },
      size: { width: itemRect.width, height: itemRect.height },
      rawPointer: { ...lastPointer },
      lastFrameTime: performance.now(),
      scrollChain: buildScrollChain(containerEl),
      rafId: null,
      activeEffects,
      commitToken: null,
    };

    options.draggingKey.value = key;
    callConsumer(() => options.onDragStart?.({ key, index: initialIndex }));

    scheduleFrame();
  };

  const scheduleFrame = () => {
    if (!session || session.phase !== 'dragging') return;
    session.rafId = requestAnimationFrame(tick);
  };

  const tick = (time: number) => {
    if (!session || session.phase !== 'dragging') return;

    const deltaTimeMs = time - session.lastFrameTime;
    session.lastFrameTime = time;

    processActiveFrame(deltaTimeMs);

    // scheduleFrame() re-checks for a live dragging session itself: processActiveFrame may have
    // ended the session synchronously (e.g. the active key disappeared).
    scheduleFrame();
  };

  const processActiveFrame = (deltaTimeMs: number) => {
    if (!session || session.phase !== 'dragging') return;
    const s = session;

    const currentKeys = callConsumer(() => options.getKeys());

    // The controlled-order check and the awaited-commit gate both run before any autoscroll
    // write, so an incompatible external mutation is always caught before a scroll side effect.
    if (checkOrderConsistency(s.confirmedSequence, currentKeys) === 'external-mutation') {
      cancelSession({ skipRollback: true });
      return;
    }

    if (s.commitToken !== null) return;

    const autoscrollResult = runAutoscrollTick(s.scrollChain, s.rawPointer, deltaTimeMs);

    // A scroll write must never be followed by a hit-test/geometry read in the same frame; that
    // work resumes next frame, once the post-scroll layout has settled.
    if (didAutoscroll(autoscrollResult)) return;

    const activeIndex = currentKeys.indexOf(s.key);

    const containerVisibleRect = getContainerVisibleRect(autoscrollResult.measurement);
    const effectivePoint = getEffectiveHitTestPoint(containerVisibleRect, s.rawPointer);
    // A zero-width/height visible area (fully clipped or scrolled-away container) has no interior
    // point to hit-test at all; skip `elementsFromPoint` entirely rather than fabricate one.
    if (!effectivePoint) return;

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

  const requestMove = (s: DraggingSession<Key>, fromIndex: number, toIndex: number) => {
    const movedKey = s.key;
    const requestedSequence = deriveMovedSequence(s.confirmedSequence, fromIndex, toIndex);

    s.pendingRequestedSequence = requestedSequence;
    callConsumer(() => {
      options.onReorder({
        key: movedKey,
        fromIndex,
        toIndex,
        orderedKeys: [...requestedSequence],
      });
    });

    const outcome = evaluateRequestedMove(
      requestedSequence,
      callConsumer(() => options.getKeys()),
    );
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
    const commitToken: CommitToken = Symbol('reorder-commit');
    s.commitToken = commitToken;

    void nextTick(() => {
      resolveCommitToken(commitToken);
    });
  };

  /**
   * Resolves one accepted move's `nextTick` wait. Ignored entirely unless the current session (in
   * either `dragging` or `settling` phase) is still awaiting exactly this `token` — an older
   * `nextTick` callback can never mutate a replaced or ended session.
   * @param token - The commit token captured when this move's `nextTick` wait was scheduled.
   */
  const resolveCommitToken = (token: CommitToken) => {
    if (!session || session.phase === 'pending' || session.commitToken !== token) return;

    const isExternalMutation =
      checkOrderConsistency(
        session.confirmedSequence,
        callConsumer(() => options.getKeys()),
      ) === 'external-mutation';

    if (session.phase === 'dragging') {
      if (isExternalMutation) {
        cancelSession({ skipRollback: true });
        return;
      }

      // The next scheduled animation frame naturally remeasures now that the gate is clear.
      session.commitToken = null;
      return;
    }

    if (isExternalMutation) {
      cancelSettlingSession(session);
      return;
    }

    finishSettlingSession(session);
  };

  const finishDraggingSession = (s: DraggingSession<Key>) => {
    const finalKeys = [...callConsumer(() => options.getKeys())];
    const finalIndex = finalKeys.indexOf(s.key);
    const changed = !sequencesEqual(finalKeys, s.initialSequence);

    session = null;
    options.draggingKey.value = null;
    options.onDragEnd?.({
      key: s.key,
      initialIndex: s.initialIndex,
      finalIndex,
      cancelled: false,
      changed,
      orderedKeys: finalKeys,
    });
  };

  const finishSettlingSession = (s: SettlingSession<Key>) => {
    const finalKeys = [...callConsumer(() => options.getKeys())];
    const finalIndex = finalKeys.indexOf(s.key);
    const changed = !sequencesEqual(finalKeys, s.initialSequence);

    session = null;
    options.draggingKey.value = null;
    options.onDragEnd?.({
      key: s.key,
      initialIndex: s.initialIndex,
      finalIndex,
      cancelled: false,
      changed,
      orderedKeys: finalKeys,
    });
  };

  const cancelSession = (cancelOptions: { skipRollback?: boolean } = {}) => {
    if (!session) return;

    if (session.phase === 'pending') {
      teardownPendingSession(session);
      return;
    }

    if (session.phase === 'dragging') {
      cancelDraggingSession(session, cancelOptions);
      return;
    }

    cancelSettlingSession(session);
  };

  const cancelDraggingSession = (
    s: DraggingSession<Key>,
    cancelOptions: { skipRollback?: boolean },
  ) => {
    const currentKeys = callConsumer(() => options.getKeys());
    let finalIndex = currentKeys.indexOf(s.key);

    const rollbackAllowed =
      !cancelOptions.skipRollback &&
      s.pendingRequestedSequence === null &&
      finalIndex !== -1 &&
      finalIndex !== s.initialIndex &&
      canRollback(s.confirmedSequence, currentKeys, s.key, s.initialIndex);

    if (rollbackAllowed) {
      const rollbackSequence = deriveMovedSequence(currentKeys, finalIndex, s.initialIndex);
      callConsumer(() => {
        options.onReorder({
          key: s.key,
          fromIndex: finalIndex,
          toIndex: s.initialIndex,
          orderedKeys: [...rollbackSequence],
        });
      });

      const keysAfterRollback = callConsumer(() => options.getKeys());
      finalIndex = sequencesEqual(keysAfterRollback, rollbackSequence)
        ? s.initialIndex
        : keysAfterRollback.indexOf(s.key);
    }

    const finalKeys = rollbackAllowed
      ? [...callConsumer(() => options.getKeys())]
      : [...currentKeys];

    session = null;
    stopGestureRuntime(s);

    // If the physical release hasn't happened yet (Escape, blur, visibility loss, a second
    // pointer, container removal, unmount, or unexpected lost capture), track it instead of
    // arming a zero-delay fallback that would expire long before the pointer actually lifts. A
    // normal release already armed suppression immediately inside the pointerup handling itself;
    // a direct `pointercancel` never gets a click, so it never arms anything either.
    if (s.terminationReason === 'not-ended') {
      clickSuppression.armReleaseWatcher({ containerEl: s.containerEl, pointerId: s.pointerId });
    }

    options.draggingKey.value = null;
    options.onDragEnd?.({
      key: s.key,
      initialIndex: s.initialIndex,
      finalIndex,
      cancelled: true,
      changed: false,
      orderedKeys: finalKeys,
    });
  };

  const cancelSettlingSession = (s: SettlingSession<Key>) => {
    // No active pointer runtime to stop, and the original pointer already physically released
    // (settling only exists after a physical pointerup), so no rollback and no release watcher
    // ever apply here: just reconcile the current controlled sequence and finish as cancelled.
    const finalKeys = [...callConsumer(() => options.getKeys())];
    const finalIndex = finalKeys.indexOf(s.key);

    session = null;
    options.draggingKey.value = null;
    options.onDragEnd?.({
      key: s.key,
      initialIndex: s.initialIndex,
      finalIndex,
      cancelled: true,
      changed: false,
      orderedKeys: finalKeys,
    });
  };

  /**
   * Stops every dragging-session DOM-level and scheduling side effect: the rAF loop, the
   * session's temporary global listeners, and pointer capture/touch/context-menu/selection guards.
   * Safe to call multiple times (each step is a no-op once already stopped) so both the immediate
   * physical-`pointerup` path and a later cancellation can call it unconditionally without
   * double-disposing anything.
   * @param s - The dragging session whose runtime side effects should stop.
   */
  const stopGestureRuntime = (s: DraggingSession<Key>): void => {
    if (s.rafId !== null) {
      cancelAnimationFrame(s.rafId);
      s.rafId = null;
    }

    globalListeners.detach();

    if (s.activeEffects) {
      s.activeEffects.dispose();
      s.activeEffects = null;
    }
  };

  const teardownPendingSession = (s: PendingSession<Key>): void => {
    session = null;
    if (s.longPressTimer !== null) clearTimeout(s.longPressTimer);
    globalListeners.detach();
  };

  /**
   * Cleans up all library-owned runtime for the current session when consumer-owned `keys`,
   * `onDragStart`, or `onReorder` throws, without invoking any further consumer callback (no
   * rollback, no `onDragEnd`). A dragging session's bounded release watcher is armed only when the
   * original pointer may still be physically held (`terminationReason === 'not-ended'`) and the
   * container is still mounted; a settling session owns no pointer runtime to stop, because
   * physical release has already happened by the time settling exists. See {@link callConsumer}.
   */
  const abortSessionOnConsumerError = (): void => {
    if (!session) return;
    const s = session;
    session = null;
    options.draggingKey.value = null;

    if (s.phase === 'pending') {
      if (s.longPressTimer !== null) clearTimeout(s.longPressTimer);
      globalListeners.detach();
      return;
    }

    if (s.phase === 'settling') return;

    stopGestureRuntime(s);

    const containerStillMounted = registry.containerEl === s.containerEl;
    if (containerStillMounted && s.terminationReason === 'not-ended') {
      clickSuppression.armReleaseWatcher({ containerEl: s.containerEl, pointerId: s.pointerId });
    }
  };

  /**
   * Invokes `fn` — a call into consumer-owned `keys`, `onDragStart`, or `onReorder` — and, if it
   * throws, deterministically aborts the current session via {@link abortSessionOnConsumerError}
   * before rethrowing the original error unchanged. Never wraps `onDragEnd`: its own exceptional
   * contract requires every effect to already be cleaned up before it is invoked, not cleaned up
   * in reaction to its own throw.
   * @param fn - The consumer call to guard.
   * @returns `fn`'s return value.
   */
  const callConsumer = <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (error) {
      abortSessionOnConsumerError();
      throw error;
    }
  };

  const attachContainer = (containerEl: HTMLElement) => {
    containerEl.addEventListener('pointerdown', onContainerPointerDown);
  };

  const detachContainer = (containerEl: HTMLElement) => {
    containerEl.removeEventListener('pointerdown', onContainerPointerDown);
    try {
      // Only one container may be mounted at a time per `useReorder` instance (enforced by
      // `vReorderContainer`'s duplicate-mount invariant), so any live session at this point
      // belongs to this containerEl regardless of its current phase.
      if (session) cancelSession();
    } finally {
      // Hard cleanup boundary: disarm unconditionally, even if cancelSession() above threw (a
      // consumer-owned `getKeys`/`onReorder`/`onDragEnd` call during cancellation can throw), so a
      // release watcher/guard/timeout that cancellation may have just armed (the container/pointer
      // is being removed, so no future release can ever be observed for it) never survives this
      // call. The original error, if any, still propagates unchanged past this `finally`.
      clickSuppression.disarm();
    }
  };

  const notifyItemUnmounted = (key: Key) => {
    if (session && session.key === key) cancelSession({ skipRollback: true });
  };

  const dispose = () => {
    try {
      cancelSession();
    } finally {
      // Hard cleanup boundary; see detachContainer's comment above.
      clickSuppression.disarm();
    }
  };

  return { attachContainer, detachContainer, notifyItemUnmounted, dispose };
};
