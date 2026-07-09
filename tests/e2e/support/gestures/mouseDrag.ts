import type { Page } from '@playwright/test';
import type { Point } from './coordinates';

/**
 * SortableJS's fallback drag mode observes the pointer position on a fixed-interval
 * poll (`setInterval(..., 50)`) rather than reacting synchronously to each move event.
 * Under the CPU contention of a full multi-spec e2e suite run, a single poll interval
 * can be delayed enough that the pointer resting briefly at the drop point isn't
 * observed before release. This margin gives the poll loop several extra ticks of
 * headroom; it is a harness settle margin for CI/full-suite load, not a fix for
 * production drag behavior.
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
