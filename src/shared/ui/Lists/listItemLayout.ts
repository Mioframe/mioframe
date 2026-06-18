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
 * Returns the inline style object that exposes the computed container height
 * as a CSS custom property for the list item.
 * The numeric source value tracks the Material dp token table, but runtime CSS
 * receives a px-backed custom property string.
 * @param resolvedHeight - the resolved Material token height as a number
 * @returns inline style record with the resolved px-backed container height custom property
 */
export const buildListItemHostStyle = (resolvedHeight: number): Record<string, string> => ({
  '--md-private-list-item-resolved-container-height': `${resolvedHeight}px`,
});
