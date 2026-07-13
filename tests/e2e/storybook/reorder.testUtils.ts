import type { CDPSession, Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** The default reorder story, shared by both the general and autoscroll behavior specs. */
export const STORY_ID = 'shared-lib-reorder-reorderstoryharness--default';

/**
 * @param page - The Playwright page to read from.
 * @returns The harness's current controlled key order.
 */
export const getOrder = async (page: Page): Promise<string[]> => {
  const text = await page.getByLabel('Current order').textContent();
  return text ? text.split(',') : [];
};

/**
 * @param page - The Playwright page to read from.
 * @param label - The harness counter's accessible label, e.g. `'Reorder count'`.
 * @returns The counter's current value.
 */
export const getCount = async (page: Page, label: string): Promise<number> => {
  const text = await page.getByLabel(label).textContent();
  return Number(text ?? '0');
};

/**
 * @param page - The Playwright page to read from.
 * @returns The harness's current `draggingKey`, or `''` when no session is active.
 */
export const getDraggingKey = async (page: Page): Promise<string> =>
  (await page.getByLabel('Dragging key').textContent()) ?? '';

/** The `Last drag end` harness payload, parsed and validated. */
export interface DragEndPayload {
  /** The key of the item that was dragging. */
  key: string;
  /** The item's index in `keys` when the session activated. */
  initialIndex: number;
  /** The item's index in `keys` when the session ended. */
  finalIndex: number;
  /** Whether the session ended by cancellation rather than a normal pointer release. */
  cancelled: boolean;
}

const isDragEndPayload = (value: unknown): value is DragEndPayload => {
  if (typeof value !== 'object' || value === null) return false;
  if (
    !('key' in value) ||
    !('initialIndex' in value) ||
    !('finalIndex' in value) ||
    !('cancelled' in value)
  ) {
    return false;
  }

  return (
    typeof value.key === 'string' &&
    typeof value.initialIndex === 'number' &&
    typeof value.finalIndex === 'number' &&
    typeof value.cancelled === 'boolean'
  );
};

/**
 * @param page - The Playwright page to read from.
 * @returns The harness's last recorded `onDragEnd` payload, or `null` before any drag has ended.
 */
export const getLastDragEnd = async (page: Page): Promise<DragEndPayload | null> => {
  const text = await page.getByLabel('Last drag end').textContent();
  if (!text) return null;

  const parsed: unknown = JSON.parse(text);
  return isDragEndPayload(parsed) ? parsed : null;
};

/**
 * @param key - An item's controlled key, e.g. `'alpha'`.
 * @returns The item's accessible name, e.g. `'Alpha'` (the harness capitalizes its item labels).
 */
export const itemLabel = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1);

/**
 * @param page - The Playwright page to read from.
 * @param key - The item's controlled key.
 * @returns A locator for the item's `listitem` role.
 */
export const getItem = (page: Page, key: string): Locator =>
  page.getByRole('listitem', { name: itemLabel(key) });

/**
 * @param box - A rectangle with `x`/`y`/`width`/`height`.
 * @returns The rectangle's center point.
 */
export const center = (box: { x: number; y: number; width: number; height: number }) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

/**
 * @param locator - The element to measure.
 * @returns The element's bounding box, scrolling it into view first.
 */
export const boxOf = async (locator: Locator) => {
  // The story's scroll containers are shorter than their content, so an item may start outside
  // the visible/clipped area; scroll it into view before trusting its layout position.
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('missing bounding box');
  return box;
};

/**
 * Mouse-drags from `from` to `to`, releasing the button unless `options.release` is `false`.
 * Shared by both the general/autoscroll specs and the activator spec.
 * @param page - The Playwright page to drive.
 * @param from - The starting pointer position.
 * @param to - The ending pointer position.
 * @param options - `steps` controls movement granularity; `release` defaults to `true`.
 */
export const mouseDrag = async (
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { steps?: number; release?: boolean } = {},
) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: options.steps ?? 8 });
  if (options.release ?? true) await page.mouse.up();
};

// Chromium tracks in-flight touch sequence state per CDP client: opening a fresh session for
// each dispatch call breaks a multi-event gesture ("Must send a TouchStart first"). Reuse one
// session per page for the whole gesture instead.
const cdpSessions = new WeakMap<Page, CDPSession>();

const getCdpSession = async (page: Page): Promise<CDPSession> => {
  const existing = cdpSessions.get(page);
  if (existing) return existing;

  const session = await page.context().newCDPSession(page);
  cdpSessions.set(page, session);
  return session;
};

/**
 * Dispatches one touch event via CDP (`Input.dispatchTouchEvent`), reusing one CDP session per
 * page across a whole multi-event gesture.
 * @param page - The Playwright page to drive.
 * @param type - The touch event type.
 * @param point - The touch point; omitted for `touchEnd`.
 */
export const dispatchTouch = async (
  page: Page,
  type: 'touchStart' | 'touchMove' | 'touchEnd',
  point?: { x: number; y: number },
) => {
  const cdp = await getCdpSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: point ? [{ x: point.x, y: point.y }] : [],
  });
};

/**
 * Polls the harness's `Dragging key` output until it equals `key`.
 * @param page - The Playwright page to read from.
 * @param key - The expected controlled key, or `''` for no active session.
 */
export const waitForDraggingKey = async (page: Page, key: string): Promise<void> => {
  await expect.poll(() => getDraggingKey(page), { timeout: 2_000 }).toBe(key);
};
