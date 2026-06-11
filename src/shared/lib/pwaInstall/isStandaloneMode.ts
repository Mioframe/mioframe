/**
 * Returns `true` when the app is running in an installed/standalone display mode.
 * Checks the `display-mode: standalone` media query (Chrome/Android) and
 * `navigator.standalone` (iOS Safari).
 * @returns Whether the app is currently in standalone display mode.
 */
export const isStandaloneMode = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
