import type { Locator, Page } from '@playwright/test';

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
