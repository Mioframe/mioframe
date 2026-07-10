/**
 * Temporary window/document-level listeners for one pending-or-active pointer session: pointer
 * move/up/cancel, a capture-phase second-pointer guard, window blur, document visibility, and the
 * `Escape` key. Installed only while a session exists; `PointerSession.ts` owns what each callback
 * does, this module only owns the wiring and the second-pointer same-dispatch exclusion.
 *
 * The second-pointer guard must not interfere with the rest of the page: it never calls
 * `stopPropagation`, `stopImmediatePropagation`, or `preventDefault`, so an external listener
 * (capture or bubble) still observes the event normally. To stop that same event from also
 * starting a *new* reorder session in this same dispatch (the current session cancels
 * synchronously, which would otherwise let the event reach the container's own bubble-phase
 * activation handler with no session in the way), this module remembers the exact `PointerEvent`
 * object for the duration of the dispatch and clears that marker in a microtask afterward. Pointer
 * ids are reused by the platform, so the exact event object — not a persisted id set — is what
 * makes the exclusion scoped to a single dispatch.
 */

/** Callbacks invoked by the wired listeners; `PointerSession.ts` supplies the session logic. */
export interface SessionGlobalListenerCallbacks {
  /** A `pointermove` anywhere while a session exists. */
  onPointerMove: (event: PointerEvent) => void;
  /** A `pointerup` anywhere while a session exists. */
  onPointerUp: (event: PointerEvent) => void;
  /** A `pointercancel` anywhere while a session exists. */
  onPointerCancel: (event: PointerEvent) => void;
  /** A capture-phase `pointerdown` from a different pointer than the session's own. */
  onSecondPointerDown: (event: PointerEvent) => void;
  /** The window losing focus. */
  onWindowBlur: () => void;
  /** The document's visibility changing (checks `document.hidden` itself). */
  onVisibilityChange: () => void;
  /** The `Escape` key. */
  onEscapeKeyDown: () => void;
}

/** The imperative controller returned by {@link createSessionGlobalListeners}. */
export interface SessionGlobalListeners {
  /** Installs every temporary listener. */
  attach: () => void;
  /** Removes every temporary listener. */
  detach: () => void;
  /**
   * @param event - A `pointerdown` event to check.
   * @returns Whether `event` is the exact event the second-pointer guard just handled this
   * dispatch, so the container's own activation handler must ignore it.
   */
  isSecondPointerEvent: (event: PointerEvent) => boolean;
}

/**
 * Creates one session's global listener controller.
 * @param callbacks - The session logic to invoke for each wired listener.
 * @returns The imperative `attach`/`detach`/`isSecondPointerEvent` controller.
 */
export const createSessionGlobalListeners = (
  callbacks: SessionGlobalListenerCallbacks,
): SessionGlobalListeners => {
  let excludedEvent: PointerEvent | null = null;

  const onGlobalPointerDown = (event: PointerEvent): void => {
    excludedEvent = event;
    queueMicrotask(() => {
      if (excludedEvent === event) excludedEvent = null;
    });

    callbacks.onSecondPointerDown(event);
  };

  const onPointerCancelEvent = (event: PointerEvent): void => {
    callbacks.onPointerCancel(event);
  };

  const onWindowBlur = (): void => {
    callbacks.onWindowBlur();
  };

  const onVisibilityChange = (): void => {
    callbacks.onVisibilityChange();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') callbacks.onEscapeKeyDown();
  };

  const attach = (): void => {
    window.addEventListener('pointermove', callbacks.onPointerMove);
    window.addEventListener('pointerup', callbacks.onPointerUp);
    window.addEventListener('pointercancel', onPointerCancelEvent);
    window.addEventListener('pointerdown', onGlobalPointerDown, true);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('keydown', onKeyDown);
  };

  const detach = (): void => {
    window.removeEventListener('pointermove', callbacks.onPointerMove);
    window.removeEventListener('pointerup', callbacks.onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancelEvent);
    window.removeEventListener('pointerdown', onGlobalPointerDown, true);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('keydown', onKeyDown);
  };

  const isSecondPointerEvent = (event: PointerEvent): boolean => event === excludedEvent;

  return { attach, detach, isSecondPointerEvent };
};
