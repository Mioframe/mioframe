/** Attribute used by SortableJS to read a stable item id from the DOM. */
export const REORDER_ITEM_ATTRIBUTE = 'data-sortable-id';
/** Attribute used to mark controls and subtrees that must not start drag. */
export const REORDER_IGNORE_ATTRIBUTE = 'data-sortable-ignore';
/**
 * Attribute used to mark a reorder item's own row-owned drag activation surface, such as a
 * nested primary-action button that visually covers the row. An element carrying this
 * attribute is exempt from the interactive-descendant filter even though it matches the
 * default interactive selector, so pressing it can still start row drag. Explicit
 * `data-sortable-ignore` subtrees and real nested controls (trailing actions, inputs, links)
 * are unaffected and stay interactive-only.
 */
export const REORDER_ACTIVATION_SURFACE_ATTRIBUTE = 'data-sortable-activation-surface';
/** Class applied to the surface while drag activation is in progress. */
export const REORDER_SURFACE_ACTIVATING_CLASS = 'reorder-surface_activating';
/** Class applied to the surface while a reorder session is active. */
export const REORDER_SURFACE_DRAGGING_CLASS = 'reorder-surface_dragging';
/** Class applied to the root document while reorder activation or drag suppresses text selection. */
export const REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS = 'reorder-selection-suppressed';

/** Default selector for descendants that should stay interactive instead of draggable. */
export const defaultReorderInteractiveSelector = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'option',
  '[contenteditable]',
  '[role="button"]',
  `[${REORDER_IGNORE_ATTRIBUTE}]`,
].join(', ');

/**
 * Scopes an interactive selector to reorder items and their descendants.
 *
 * Each clause except the explicit ignore-attribute clause excludes elements carrying
 * {@link REORDER_ACTIVATION_SURFACE_ATTRIBUTE}, so a row's own drag activation surface (e.g. a
 * nested primary-action button) is not treated as a separate interactive descendant. Ignored
 * subtrees are never exempted this way, so an explicit ignore always wins.
 * @param interactiveSelector - Selector list describing descendants that should remain interactive.
 * @returns The selector list scoped to draggable reorder items and their descendants.
 */
export const getReorderDescendantInteractiveSelector = (interactiveSelector: string): string =>
  interactiveSelector
    .split(',')
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => {
      const scopedSelector =
        selector === `[${REORDER_IGNORE_ATTRIBUTE}]`
          ? selector
          : `${selector}:not([${REORDER_ACTIVATION_SURFACE_ATTRIBUTE}])`;

      return `[${REORDER_ITEM_ATTRIBUTE}]${scopedSelector}, [${REORDER_ITEM_ATTRIBUTE}] ${scopedSelector}`;
    })
    .join(', ');

/** Class names forwarded to SortableJS for drag state styling. */
export const reorderClassNames = {
  chosen: 'reorder-item_chosen',
  drag: 'reorder-item_drag',
  ghost: 'reorder-item_ghost',
  fallback: 'reorder-item_fallback',
} as const;
