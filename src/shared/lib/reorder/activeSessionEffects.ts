/**
 * Installs and disposes the DOM-level side effects owned by an *active* drag session: pointer
 * capture, lost-capture cancellation wiring, and the touch-scroll/context-menu/text-selection
 * guards that keep an active gesture from also triggering native browser behavior. Session state
 * transitions stay in `PointerSession.ts`; this module only owns installing and tearing down
 * these DOM side effects as one unit.
 */

/** The installed effects for one active session, returned by {@link acquireActiveSessionEffects}. */
export interface ActiveSessionEffects {
  /** Releases pointer capture (if still held) and removes every installed guard/listener. */
  dispose: () => void;
}

/**
 * @param containerEl - The reorder container to capture the pointer on and install guards on.
 * @param pointerId - The active session's pointer id.
 * @param pointerType - The active session's pointer type; touch guards install only for `'touch'`.
 * @param onLostPointerCapture - Invoked if the browser revokes pointer capture unexpectedly.
 * @returns The installed effects, or `null` when pointer capture could not be acquired (the
 * pointer was already released or invalid) — in that case nothing was installed.
 */
export const acquireActiveSessionEffects = (
  containerEl: HTMLElement,
  pointerId: number,
  pointerType: 'mouse' | 'touch',
  onLostPointerCapture: (event: PointerEvent) => void,
): ActiveSessionEffects | null => {
  try {
    containerEl.setPointerCapture(pointerId);
  } catch {
    return null;
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

  const dispose = (): void => {
    if (containerEl.hasPointerCapture(pointerId)) {
      try {
        containerEl.releasePointerCapture(pointerId);
      } catch {
        // Capture already released by the browser.
      }
    }

    containerEl.removeEventListener('lostpointercapture', onLostPointerCapture);
    if (touchScrollGuard) containerEl.removeEventListener('touchmove', touchScrollGuard);
    if (contextMenuGuard) containerEl.removeEventListener('contextmenu', contextMenuGuard);
    document.removeEventListener('selectstart', selectionGuard);
  };

  return { dispose };
};
