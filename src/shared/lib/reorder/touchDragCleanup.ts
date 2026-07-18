/**
 * Best-effort haptic feedback for a successfully activated touch drag. No-op for every other
 * pointer type, and silently ignored when `navigator.vibrate` is unsupported or rejected.
 * @param pointerType - The pointer type that activated the drag, or `undefined` when unknown.
 */
export const attemptTouchHapticFeedback = (pointerType: string | undefined): void => {
  if (pointerType !== 'touch') {
    return;
  }

  try {
    // `navigator.vibrate` is typed as always present, but real browsers may omit it; the
    // surrounding try/catch covers that case as a best-effort no-op.
    navigator.vibrate(10);
  } catch {
    // Best effort only: some browsers reject vibration outside a user gesture.
  }
};

/**
 * Schedules one animation frame of post-drag browser cleanup for a completed or canceled
 * touch/pen drag: clears the active document selection and blurs the focused element when it is,
 * or is contained by, the active sortable source. No-op for mouse drags.
 * @param pointerType - The pointer type that activated the drag, or `undefined` when unknown.
 * @param sourceElement - The active sortable source element, or `null`/`undefined` when unavailable.
 */
export const scheduleTouchDragCleanup = (
  pointerType: string | undefined,
  sourceElement: Element | null | undefined,
): void => {
  if (pointerType !== 'touch' && pointerType !== 'pen') {
    return;
  }

  requestAnimationFrame(() => {
    const selection = document.getSelection();

    if (selection && selection.rangeCount > 0) {
      selection.removeAllRanges();
    }

    const focusedElement = document.activeElement;

    if (
      focusedElement instanceof HTMLElement &&
      (focusedElement === sourceElement || (sourceElement?.contains(focusedElement) ?? false)) &&
      typeof focusedElement.blur === 'function'
    ) {
      focusedElement.blur();
    }
  });
};
