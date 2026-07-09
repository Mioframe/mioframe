import type { Page } from '@playwright/test';
import type { Point } from './coordinates';

/**
 * The reorder engine reacts synchronously to each pointermove, but sibling rows travel
 * through a short transform transition and the app applies the committed order through
 * a Vue re-render. This margin lets those settle at the drop point before release under
 * CI/full-suite CPU load; it is a harness settle margin, not a fix for production
 * reorder behavior.
 */
const MOUSE_DRAG_DROP_SETTLE_MS = 300;

/** Tuning for {@link performMouseDrag}. */
export interface MouseDragOptions {
  /** Intermediate mousemove samples Playwright synthesizes between start and end. */
  steps?: number;
  /** Wall-clock pause at the drop point before release. See {@link MOUSE_DRAG_DROP_SETTLE_MS}. */
  settleMs?: number;
}

/**
 * Performs a real desktop mouse drag from one point to another using Playwright's
 * native mouse input (not synthetic `dispatchEvent`). Real mouse input goes through
 * the browser's own input pipeline, including pointer-event synthesis, which a plain
 * `dispatchEvent(new MouseEvent(...))` bypasses entirely.
 * @param page - Page to drive the drag on.
 * @param from - Press coordinate.
 * @param to - Release coordinate.
 * @param options - Drag tuning.
 */
export const performMouseDrag = async (
  page: Page,
  from: Point,
  to: Point,
  { steps = 12, settleMs = MOUSE_DRAG_DROP_SETTLE_MS }: MouseDragOptions = {},
) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.waitForTimeout(settleMs);
  await page.mouse.up();
};
