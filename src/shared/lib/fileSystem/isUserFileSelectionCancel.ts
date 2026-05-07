/**
 * Detects when the user dismisses a native file-system picker without completing a selection.
 * @param error - The thrown picker error.
 * @returns Whether the error represents a user cancellation.
 */
export const isUserFileSelectionCancel = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';
