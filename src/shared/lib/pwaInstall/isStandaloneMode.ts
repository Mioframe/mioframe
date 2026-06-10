/**
 * Returns `true` when the app is running in an installed/standalone display mode.
 * Uses `display-mode: standalone` media query — works for installed PWAs.
 * @returns Whether the app is currently in standalone display mode.
 */
export const isStandaloneMode = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches;
