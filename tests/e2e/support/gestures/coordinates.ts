import type { Locator } from '@playwright/test';

/** A single viewport-relative coordinate, in CSS pixels. */
export interface Point {
  /** Horizontal viewport coordinate, in CSS pixels. */
  x: number;
  /** Vertical viewport coordinate, in CSS pixels. */
  y: number;
}

/**
 * Scrolls a locator into view and resolves the CSS-pixel center point of its rendered
 * bounding box. Layout-aware: reads the box fresh each call rather than caching a
 * coordinate that could go stale after a reorder or scroll.
 * @param locator - Element to resolve a center point for.
 * @returns The element's current center point in viewport coordinates.
 */
export const getCenterPoint = async (locator: Locator): Promise<Point> => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Cannot resolve a center point: locator has no bounding box');
  }

  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};
