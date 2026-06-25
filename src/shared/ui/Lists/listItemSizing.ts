/** Minimum list-item container heights keyed by resolved Material line count. */
export interface MDListItemHeights {
  /** One-line row minimum height. */
  1: number;
  /** Two-line row minimum height. */
  2: number;
  /** Three-line row minimum height. */
  3: number;
}

// Current Material / Expressive row heights.
export const MD_LIST_ITEM_MIN_HEIGHTS: MDListItemHeights = {
  1: 56,
  2: 72,
  3: 88,
};

/**
 * Returns the shared Material minimum row heights.
 * @returns The minimum row heights keyed by line count.
 */
export const getMDListItemHeights = (): MDListItemHeights => MD_LIST_ITEM_MIN_HEIGHTS;
