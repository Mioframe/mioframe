/**
 * Internal tuning constants for the reorder library.
 *
 * None of these are part of the public API; the first public version does
 * not expose an autoscroll/activation configuration object.
 */

/** Minimum mouse movement, in CSS px, before a pending session activates. */
export const MOUSE_ACTIVATION_THRESHOLD_PX = 4;

/** Movement, in CSS px, that cancels a pending touch long-press before it fires. */
export const TOUCH_MOVEMENT_SLOP_PX = 8;

/** Default long-press delay, in milliseconds, before a touch session activates. */
export const DEFAULT_LONG_PRESS_DELAY_MS = 400;

/** Distance, in CSS px, from a scroll target's visible edge where autoscroll begins. */
export const AUTOSCROLL_EDGE_ZONE_PX = 56;

/** Maximum autoscroll speed, in CSS px per second, reached at or beyond the visible edge. */
export const AUTOSCROLL_MAX_SPEED_PX_PER_SEC = 900;

/** Native elements that must not start drag activation from a pointerdown inside them. */
export const REORDER_INTERACTIVE_TAG_NAMES = new Set([
  'BUTTON',
  'A',
  'INPUT',
  'TEXTAREA',
  'SELECT',
]);
