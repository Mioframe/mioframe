import type { MDListVariant } from './listContext';

/** Minimum list-item container heights keyed by resolved Material line count. */
export interface MDListItemHeights {
  /** One-line row minimum height. */
  1: number;
  /** Two-line row minimum height. */
  2: number;
  /** Three-line row minimum height. */
  3: number;
}

// Baseline list rows keep the original M3 container heights.
export const MD_BASELINE_LIST_ITEM_MIN_HEIGHTS: MDListItemHeights = {
  1: 56,
  2: 72,
  3: 88,
};

// Expressive rows keep the same multi-line thresholds but use a taller
// one-line minimum to match the roomier segmented expressive presentation.
export const MD_EXPRESSIVE_LIST_ITEM_MIN_HEIGHTS: MDListItemHeights = {
  1: 64,
  2: 72,
  3: 88,
};

/**
 * Resolves the shared Material minimum row heights for the active list variant.
 * @param variant - Active list variant.
 * @returns The minimum row heights keyed by line count.
 */
export const getMDListItemHeights = (variant: MDListVariant): MDListItemHeights =>
  variant === 'baseline' ? MD_BASELINE_LIST_ITEM_MIN_HEIGHTS : MD_EXPRESSIVE_LIST_ITEM_MIN_HEIGHTS;
