import type { ComputedRef } from 'vue';
import { getMDListItemHeights } from './listItemSizing';
import type { MDListVariant } from './listContext';

/**
 * Resolves the Material line count for a list item from its slot/prop presence.
 * Explicit `lineCount` always wins; otherwise derived from content presence.
 * @param hasOverline - true when the overline slot is filled
 * @param hasSupportingText - true when the supportingText slot is filled
 * @param lineCount - explicit override from the `lineCount` prop
 * @returns the resolved 1, 2, or 3-line Material line count
 */
export const resolveListItemLineCount = (
  hasOverline: boolean,
  hasSupportingText: boolean,
  lineCount?: 1 | 2 | 3,
): 1 | 2 | 3 => {
  if (lineCount) {
    return lineCount;
  }

  if (hasOverline && hasSupportingText) {
    return 3;
  }

  if (hasOverline || hasSupportingText) {
    return 2;
  }

  return 1;
};

/**
 * Resolves the minimum container height for the active variant and resolved line count.
 * Falls back to 56dp when no list context is available.
 * @param variant - the active MDList variant, or undefined when outside a list
 * @param resolvedLineCount - the resolved 1, 2, or 3-line count
 * @returns the minimum container height in dp
 */
export const resolveListItemHeight = (
  variant: MDListVariant | undefined,
  resolvedLineCount: 1 | 2 | 3,
): number => {
  const heights = getMDListItemHeights(variant ?? 'baseline');
  return heights[resolvedLineCount];
};

/**
 * Returns the inline style object that exposes the computed container height
 * as a CSS custom property for the list item.
 * @param resolvedHeight - the height in dp returned by `resolveListItemHeight`
 * @returns inline style record with the resolved container height custom property
 */
export const buildListItemHostStyle = (resolvedHeight: number): Record<string, string> => ({
  '--md-private-list-item-resolved-container-height': `${resolvedHeight}px`,
});

/**
 * Returns typed reactive height values keyed by line count from a variant ref.
 * Convenience wrapper that accepts a computed variant value directly.
 * @param variant - computed ref of the active MDList variant
 * @returns height map keyed by line count (1, 2, 3) in dp
 */
export const getListItemHeightsForVariant = (
  variant: ComputedRef<MDListVariant>,
): Record<1 | 2 | 3, number> => getMDListItemHeights(variant.value);
